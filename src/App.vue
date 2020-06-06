<template>
  <div id="app" class="container">
    <div class="mt-5 p-3">
      <div id="input_container">
        <i class="fa fa-search" aria-hidden="true" id="input_img_search"></i>
        <input
          ref="autocomplete"
          placeholder="Search for City"
          class="search-location"
          type="text"
          v-model="city"
        />
        <i class="fa fa-map-marker fa-lg" aria-hidden="true" id="input_img"></i>
      </div>
      <div class="d-flex justify-content-between mt-4 flex-wrap">
        <div
          v-for="(card, index) in weekForcast"
          :key="index"
          class="dayCard p-1"
        >
          <div>
            <p class="cardDay m-0">{{ card.day }}</p>
            <p class="cardTemp">
              <span class="temp-max">{{ card.temp_max }}°</span
              ><span class="temp-min pl-1">{{ card.temp_min }}°</span>
            </p>
            <p><img v-bind:src="card.icon" /></p>
            <p class="cardStatus">{{ card.status }}</p>
          </div>
        </div>
      </div>
      <div class="weather-chart-card mt-4">
        <div>
          <span class="currentTemp pt-4"
            ><span v-if="loading"><img src="./assets/load.gif"/></span
            ><span v-else>{{ weatherObj.currentTemp }}</span
            >°C</span
          ><span class="weather-icon ml-5"
            ><img v-bind:src="weatherObj.weatherIcon"
          /></span>
          <figure class="highcharts-figure p-5">
            <div id="container"></div>
          </figure>
          <div class="d-flex justify-content-between p-5">
            <div class="p-h-box">
              <p class="p-h-head m-0 pl-4 pt-2">Pressure</p>
              <p class="p-h-value pl-4">
                <span v-if="loading"><img src="./assets/load_sm.gif"/></span
                ><span v-else>{{ weatherObj.pressure }}</span> hpa
              </p>
            </div>
            <div class="p-h-box">
              <p class="p-h-head m-0 pl-4 pt-2">Humidity</p>
              <p class="p-h-value pl-4">
                <span v-if="loading"><img src="./assets/load_sm.gif"/></span
                ><span v-else>{{ weatherObj.humidity }}</span> %
              </p>
            </div>
          </div>
        </div>
        <div class="sunChart">
          <div class="d-flex justify-content-between p-5">
            <div class="sun-box">
              <p class="sun-head m-0 pl-4 pt-2">Sunrise</p>
              <p class="sun-value pl-4">
                <span v-if="loading"><img src="./assets/load_sm.gif"/></span
                ><span v-else>{{ weatherObj.sunrise }}</span
                >am
              </p>
            </div>
            <div class="sun-box">
              <p class="sun-head m-0 pl-4 pt-2">Sunset</p>
              <p class="sun-value pl-4">
                <span v-if="loading"><img src="./assets/load_sm.gif"/></span
                ><span v-else>{{ weatherObj.sunset }}</span
                >pm
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";
export default {
  name: "app",
  components: {
    Multiselect
  },
  data() {
    return {
      value: null,
      weekForcast: [],
      coordinates: {
        lat: 0,
        lng: 0
      },
      city: undefined,
      weatherObj: {
        currentTemp: undefined,
        weatherIcon: undefined,
        pressure: undefined,
        humidity: undefined,
        sunrise: undefined,
        sunset: undefined
      },
      loading: true,
      response: undefined
    };
  },
  created() {
    this.getLoc();
  },
  watch: {
    async "coordinates.lat"() {
      if (this.coordinates.lat != 0) {
        let url =
          "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
          this.coordinates.lat +
          "," +
          this.coordinates.lng +
          "&sensor=true&key=AIzaSyB1re9hEyUHWuhsZyab_CmKRfN4pn0IvVk";
        let res = await fetch(url);
        let data = await res.json();
        this.city = this.latLngToCity(data.plus_code.compound_code);
        this.cityTempSearch();
      }
    }
  },
  mounted() {
    this.autocomplete = new google.maps.places.Autocomplete(
      this.$refs.autocomplete,
      { types: ["geocode"] }
    );
    this.autocomplete.addListener("place_changed", () => {
      let place = this.autocomplete.getPlace();
      let ac = place.address_components;
      let lat = place.geometry.location.lat();
      let lon = place.geometry.location.lng();
      this.city = ac[0]["short_name"];
      if (this.city) {
        this.cityTempSearch();
      }
    });
  },
  methods: {
    async getLoc() {
      this.$getLocation({}).then(coordinates => {
        this.coordinates = coordinates;
      });
    },
    epochToDay(eph) {
      return new Date(eph * 1000).toString().slice(0, 3);
    },
    epochToHour(eph) {
      return new Date(eph * 1000).toString().slice(16, 18);
    },
    epochToMin(eph) {
      return new Date(eph * 1000).toString().slice(18, 21);
    },
    epochToTime(eph) {
      return new Date(eph * 1000).toString().slice(16, 21);
    },
    kelvinToCelcius(temp) {
      return Math.floor(temp - 273);
    },
    latLngToCity(str) {
      let city = str.split(",")[0];
      return city.substring(city.indexOf(" ") + 1);
    },
    weatherImage(weatherStatus) {
      let weatherIcon;
      if (weatherStatus === "Haze") {
        weatherIcon = "../src/assets/haze.png";
      } else if (weatherStatus === "Clouds") {
        weatherIcon = "../src/assets/clouds.png";
      } else if (weatherStatus === "Rain") {
        weatherIcon = "../src/assets/rain.png";
      } else if (weatherStatus === "Clear") {
        weatherIcon = "../src/assets/sun.png";
      }
      return weatherIcon;
    },
    async cityTempSearch() {
      this.loading = true;
      this.weekForcast = [];
      let url =
        "http://api.openweathermap.org/data/2.5/forecast?q=" +
        this.city +
        "&appid=6f7b9051c7ed970c4a1058ed45ceb9d9";
      await fetch(url)
        .then(res => res.json())
        .then(res => (this.response = res))
        .catch(err => console.log(err))
        .finally(() => (this.loading = false));
      let j = 0;
      for (let i = 0; i < 5; i++) {
        this.weekForcast.push({
          day: this.epochToDay(this.response.list[j].dt),
          temp_max: this.kelvinToCelcius(this.response.list[j].main.temp_max),
          temp_min: this.kelvinToCelcius(this.response.list[j].main.temp_min),
          icon: this.weatherImage(this.response.list[j].weather[0].main),
          status: this.response.list[j].weather[0].main
        });
        j = j + 8;
      }
      this.weatherObj.currentTemp = this.kelvinToCelcius(
        this.response.list[0].main.temp
      );
      this.weatherObj.weatherIcon = this.weatherImage(
        this.response.list[0].weather[0].main
      );
      this.weatherObj.pressure = this.response.list[0].main.pressure;
      this.weatherObj.humidity = this.response.list[0].main.humidity;
      this.weatherObj.sunrise =
        this.epochToHour(this.response.city.sunrise) +
        this.epochToMin(this.response.city.sunrise);
      let sunsetHour = parseInt(this.epochToHour(this.response.city.sunset));
      if (sunsetHour > 12) {
        sunsetHour = sunsetHour - 12;
      }
      this.weatherObj.sunset =
        "0" + sunsetHour + this.epochToMin(this.response.city.sunset);
      var chartData = [];
      for (let i = 0; i < 6; i++) {
        let arr = [];
        arr.push(i + 1);
        arr.push(this.kelvinToCelcius(this.response.list[i].main.temp));
        chartData.push(arr);
      }
      Highcharts.chart("container", {
        chart: {
          type: "spline"
        },
        title: {
          text: ""
        },
        subtitle: {
          text: ""
        },
        xAxis: {
          reversed: false,
          title: {
            enabled: true,
            text: ""
          },
          labels: {
            format: "{value}"
          },
          maxPadding: 0.01,
          showLastLabel: true
        },
        yAxis: {
          title: {
            text: ""
          },
          labels: {
            format: "{value}'C"
          },
          lineWidth: 2
        },
        legend: {
          enabled: false
        },
        tooltip: {
          headerFormat: "<b>{series.name}</b><br/>",
          pointFormat: "{point.x}: {point.y}°C"
        },
        plotOptions: {
          spline: {
            marker: {
              enable: false
            }
          }
        },
        series: [
          {
            name: "Temperature",
            data: chartData
          }
        ]
      });
    }
  }
};
</script>
<style >
#app {
  border-radius: 10px;
  background-color: white;
}
.dayCard {
  width: 14%;
  border: 2px solid white;
  text-align: center;
}
.dayCard:hover {
  border: 2px solid rgb(101, 101, 230);
  border-radius: 5px;
}
.cardDay {
  font-weight: 700;
  font-size: 17px;
}
.cardStatus {
  color: grey;
  font-size: 15px;
  font-weight: 500;
}

.temp-max {
  font-weight: 700;
}
.temp-min {
  font-weight: 400;
}
.search-location {
  width: 100%;
  margin: 0 auto;
  font-size: 17px;
  font-weight: 700;
  border-radius: 7px;
  padding: 10px;
  padding-left: 35px;
  border: 1px solid white;
  box-shadow: 1.5px 1.5px 3px 3px #888888;
}
input:focus {
  outline: none;
}
#input_container {
  position: relative;
  padding: 0;
  margin: 0;
}
#input {
  height: 20px;
  margin: 0;
  padding-left: 30px;
}
#input_img {
  position: absolute;
  bottom: 8px;
  left: 10px;
  top: 17px;
  width: 10px;
  height: 10px;
}
#input_img_search {
  position: absolute;
  bottom: 8px;
  right: 25px;
  top: 17px;
  width: 10px;
  height: 10px;
}
.currentTemp {
  font-size: 64px;
  font-weight: 800;
  padding-left: 50px;
}
.weather-icon {
  font-size: 50px;
  font-weight: 800;
}
.weather-chart-card {
  border-radius: 7px;
  box-shadow: 1.5px 1.5px 3px 3px #888888;
}
.highcharts-figure,
.highcharts-data-table table {
  min-width: 310px;
  max-width: 100%;
  margin: 1em auto;
}
.highcharts-data-table table {
  font-family: Verdana, sans-serif;
  border-collapse: collapse;
  border: 1px solid #ebebeb;
  margin: 10px auto;
  text-align: center;
  width: 100%;
  max-width: 100%;
}
.highcharts-data-table caption {
  padding: 1em 0;
  font-size: 1.2em;
  color: #555;
}
.highcharts-data-table th {
  font-weight: 600;
  padding: 0.5em;
}
.highcharts-data-table td,
.highcharts-data-table th,
.highcharts-data-table caption {
  padding: 0.5em;
}
.highcharts-data-table thead tr,
.highcharts-data-table tr:nth-child(even) {
  background: #f8f8f8;
}
.highcharts-data-table tr:hover {
  background: #f1f7ff;
}
.p-h-box {
  width: 48%;
  background-color: rgb(241, 241, 245);
}
.sun-head,
.p-h-head {
  font-size: 18px;
  font-weight: 800;
}
.sun-value,
.p-h-value {
  font-size: 18px;
  font-weight: 500;
}
</style>
