define(["jquery", "knockout", "CCi18n", "./charts.js"], function (
  $,
  ko,
  CCi18n
) {
  "use strict";
  return {
    visibleChart: ko.observable(true),
    averageEconomy: ko.observable(0),
    totalProducts: ko.observable(0),
    filters: ko.observableArray(),
    selectedFilter: ko.observable(),
    orderInfo: ko.observable([]),
    itemsQualidoc: ko.observable([]),
    itemsConcurrency: ko.observable([]),
    ordersConcurrency: ko.observable([]),
    ordersQualidoc: ko.observable([]),
    onLoad: function (widget) {
      widget.setFilters();
      widget.getInfoOrder();
      $.Topic("CHART_CONTEXT_SUCCESS").subscribe(function (value) {
        var context = value[0];
        var canvas = value[1];
        widget.calculationOrder();
        widget.createChart(context, canvas);
      });
      widget.orderInfo.subscribe(function () {});
    },
    formatDate: function (date, type) {
      var dd = date.getDate();
      var mm = date.getMonth() + 1;
      var yyyy = date.getFullYear();
      if (type === "days") {
        if (dd < 10) {
          dd = "0" + dd;
        }
        if (mm < 10) {
          mm = "0" + mm;
        }
        date = dd + "/" + mm;
      } else if (type === "months") {
        date = mm;
      } else {
        if (dd < 10) {
          dd = "0" + dd;
        }
        if (mm < 10) {
          mm = "0" + mm;
        }
        date = dd + "/" + mm + "/" + yyyy;
      }
      return date;
    },
    getPreviousDays: function (range) {
      var widget = this;
      var dates = [];
      for (var i = 0; i < range; i++) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(widget.formatDate(d, "days"));
      }
      return dates.reverse();
    },
    getPreviousMonths: function (range) {
      var widget = this;
      var previousMonths = [];
      var monthsObject = [
        { name: "Jan", num: 1 },
        { name: "Fev", num: 2 },
        { name: "Mar", num: 3 },
        { name: "Abr", num: 4 },
        { name: "Mai", num: 5 },
        { name: "Jun", num: 6 },
        { name: "Jul", num: 7 },
        { name: "Ago", num: 8 },
        { name: "Set", num: 9 },
        { name: "Out", num: 10 },
        { name: "Nov", num: 11 },
        { name: "Dez", num: 12 },
      ];
      for (var i = 0; i < range; i++) {
        var d = new Date();
        d.setMonth(d.getMonth() - i);
        previousMonths.push(widget.formatDate(d, "months"));
      }
      var months = previousMonths.map(function (prevMonth) {
        return monthsObject.find(function (obj) {
          return obj.num === prevMonth;
        });
      });
      months.reverse();
      var formattedMonths = months.map(function (month) {
        return month.name;
      });
      return formattedMonths;
    },
    getMonth: function (num) {
      var monthsObject = [
        { name: "Jan", num: 1 },
        { name: "Fev", num: 2 },
        { name: "Mar", num: 3 },
        { name: "Abr", num: 4 },
        { name: "Mai", num: 5 },
        { name: "Jun", num: 6 },
        { name: "Jul", num: 7 },
        { name: "Ago", num: 8 },
        { name: "Set", num: 9 },
        { name: "Out", num: 10 },
        { name: "Nov", num: 11 },
        { name: "Dez", num: 12 },
      ];
      var month = monthsObject.filter(function (month) {
        return month.num === num;
      })[0];
      return month;
    },
    setFilters: function (dates) {
      var widget = this;
      // Model of a filter instance
      var Filter = function (order, displayName, labels) {
        this.order = order;
        this.displayName = displayName;
        this.labels = labels;
      };
      // Labels to show at the bottom of the chart
      var lastMonth = widget.getPreviousDays(30);
      var lastWeek = widget.getPreviousDays(7);
      var lastSemester = widget.getPreviousMonths(6);
      var lastYear = widget.getPreviousMonths(12);
      // Filter instances
      var filters = [
        new Filter("lastWeek", "Últimos 7 dias", lastWeek),
        new Filter("lastMonth", "Últimos 30 dias", lastMonth),
        new Filter("lastSemester", "Últimos 6 meses", lastSemester),
        new Filter("lastYear", "Último ano", lastYear),
      ];
      // Default selected filter
      var selectedFilter = filters.filter(function (filter) {
        return filter.order === "lastMonth";
      })[0];
      widget.filters(filters);
      widget.selectedFilter(selectedFilter);
    },
    setDates: function () {
      var widget = this;
      // Test dynamic filters
      var ordersConcurrency = widget.itemsConcurrency();
      var ordersQualidoc = widget.itemsQualidoc();
      var selectedFilter = widget.selectedFilter();
      var labels = selectedFilter.labels;
      if (
        selectedFilter.order === "lastWeek" ||
        selectedFilter.order === "lastMonth"
      ) {
        // dias
        var concurrencyMappedPrices = labels.map(function (label) {
          var order = ordersConcurrency.filter(function (order) {
            var d = new Date(order.date);
            var formattedDate = widget.formatDate(d, "days");
            return formattedDate === label;
          })[0];
          if (order) {
            return order.total;
          } else {
            return 0;
          }
        });
        var qualidocMappedPrices = labels.map(function (label) {
          var order = ordersQualidoc.filter(function (order) {
            var d = new Date(order.date);
            var formattedDate = widget.formatDate(d, "days");
            return formattedDate === label;
          })[0];
          if (order) {
            return order.total;
          } else {
            return 0;
          }
        });
        widget.ordersConcurrency(concurrencyMappedPrices);
        widget.ordersQualidoc(qualidocMappedPrices);
      } else if (
        selectedFilter.order === "lastSemester" ||
        selectedFilter.order === "lastYear"
      ) {
        // meses
        var monthsOrderConcurrency = labels.map(function (label) {
          var orderDate = ordersConcurrency.filter(function (order) {
            var m = new Date(order.date);
            var formattedDate = widget.formatDate(m, "months");
            var monthString = widget.getMonth(formattedDate);
            return monthString.name === label;
          });
          var totalMonth = orderDate.reduce(function (acc, value) {
            return acc + value.total;
          }, 0);
          return totalMonth;
        });
        var monthsOrderQualidoc = labels.map(function (label) {
          var orderDate = ordersQualidoc.filter(function (order) {
            var m = new Date(order.date);
            var formattedDate = widget.formatDate(m, "months");
            var monthString = widget.getMonth(formattedDate);
            return monthString.name === label;
          });
          var totalMonth = orderDate.reduce(function (acc, value) {
            return acc + value.total;
          }, 0);
          return totalMonth;
        });
        widget.ordersConcurrency(monthsOrderConcurrency);
        widget.ordersQualidoc(monthsOrderQualidoc);
      } else {
        // erro
      }
    },
    getChartContext: function () {
      var canvas = document.getElementById("myChart");
      var context = canvas.getContext("2d");
      if (canvas && context) {
        $.Topic("CHART_CONTEXT_SUCCESS").publish([context, canvas]);
      }
    },
    createChart: function (context, canvas) {
      var widget = this;
      var labels = widget.selectedFilter().labels;
      widget.setDates();
      var qualidocColor = context.createLinearGradient(
        0,
        0,
        0,
        canvas.height * 1.8
      );
      qualidocColor.addColorStop(0, "rgba(0, 169, 224, 1)");
      qualidocColor.addColorStop(1, "rgba(0, 169, 224, 0)");
      var concurrencyColor = context.createLinearGradient(
        0,
        0,
        0,
        canvas.height * 1.8
      );
      concurrencyColor.addColorStop(0, "rgba(239,79,116, 1)");
      concurrencyColor.addColorStop(1, "rgba(239,79,116, 0)");
      var itemsQualidoc = widget.ordersQualidoc();
      var itemsConcurrency = widget.ordersConcurrency();
      var chart = widget.drawChart(
        context,
        labels,
        qualidocColor,
        concurrencyColor,
        itemsQualidoc,
        itemsConcurrency
      );
      // Watches the filter changes to draw a new chart
      widget.selectedFilter.subscribe(function (filter) {
        labels = filter.labels;
        widget.setDates();
        itemsQualidoc = widget.ordersQualidoc();
        itemsConcurrency = widget.ordersConcurrency();
        chart.destroy();
        chart = widget.drawChart(
          context,
          labels,
          qualidocColor,
          concurrencyColor,
          itemsQualidoc,
          itemsConcurrency
        );
      });
    },
    drawChart: function (
      context,
      labels,
      qualidocColor,
      concurrencyColor,
      totalQualidoc,
      totalConcurrency
    ) {
      var widget = this;

      var customTooltips = function(tooltip) {
        // Tooltip Element
        var tooltipEl = document.getElementById('chartjs-tooltip');

        if (!tooltipEl) {
          tooltipEl = document.createElement('div');
          tooltipEl.id = 'chartjs-tooltip';
          tooltipEl.innerHTML = '<table></table>';
          this._chart.canvas.parentNode.appendChild(tooltipEl);
        }

        // Hide if no tooltip
			if (tooltip.opacity === 0) {
				tooltipEl.style.opacity = 0;
				return;
			}

			// Set caret Position
			tooltipEl.classList.remove('above', 'below', 'no-transform');
			if (tooltip.yAlign) {
				tooltipEl.classList.add(tooltip.yAlign);
			} else {
				tooltipEl.classList.add('no-transform');
			}

			function getBody(bodyItem) {
				return bodyItem.lines;
			}

			// Set Text
			if (tooltip.body) {
				var titleLines = tooltip.title || [];
				var bodyLines = tooltip.body.map(getBody);

				var innerHtml = '<thead>';

				titleLines.forEach(function(title) {
					innerHtml += '<tr><th>' + title + '</th></tr>';
				});
				innerHtml += '</thead><tbody>';

				bodyLines.forEach(function(body, i) {
					var colors = tooltip.labelColors[i];
					var style = 'background:' + colors.backgroundColor;
					style += '; border-color:' + colors.borderColor;
					style += '; border-width: 2px';
					var span = '<span class="chartjs-tooltip-key" style="' + style + '"></span>';
					innerHtml += '<tr><td>' + span + body + '</td></tr>';
				});
				innerHtml += '</tbody>';

				var tableRoot = tooltipEl.querySelector('table');
				tableRoot.innerHTML = innerHtml;
			}

			var positionY = this._chart.canvas.offsetTop;
			var positionX = this._chart.canvas.offsetLeft;

			// Display, position, and set styles for font
			tooltipEl.style.opacity = 1;
			tooltipEl.style.left = positionX + tooltip.caretX + 'px';
			tooltipEl.style.top = positionY + tooltip.caretY + 'px';
			tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
			tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
			tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
			tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
      };

      // Returns a chart instance with new values passed as parameters
      return new Chart(context, {
        responsive: true,
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Valor Qualidoc",
              data: totalQualidoc,
              backgroundColor: qualidocColor,
              borderColor: "rgb(0,169,224)",
              borderWidth: 4,
              lineTension: 0,
              pointBorderColor: "rgba(0, 0, 0, 0)",
              pointBackgroundColor: "rgb(0,169,224)",
              pointBorderWidth: 0,
              pointStyle: "line",
            },
            {
              label: "Valor Concorrencia",
              data: totalConcurrency,
              backgroundColor: concurrencyColor,
              borderColor: "rgb(239,79,116)",
              borderWidth: 4,
              lineTension: 0,
              pointBorderColor: "rgba(0, 0, 0, 0)",
              pointBackgroundColor: "rgb(239,79,116)",
              pointBorderWidth: 0,
              pointStyle: "line",
            },
          ],
        },
        options: {
          reponsive: true,
          maintainAspectRatio: false,
          scales: {
            yAxes: [
              {
                gridLines: false,
                ticks: {
                  stepSize: 50,
                  // autoSkip: true,
                  // autoSkipPadding: 50,
                  // labelOffset: 50,
                  max: 200,
                  beginAtZero: true,
                  padding: 21,
                  fontColor: "#5C5C60",
                  fontFamily: "Ubuntu",
                  fontStyle: "bold",
                  callback: function (value) {
                    if (value >= 1) {
                      return "R$ " + value.toFixed(2);
                    } else {
                      return 0;
                    }
                  },
                },
              },
            ],
            xAxes: [
              {
                ticks: {
                  padding: 21,
                  fontColor: "#5C5C60",
                  fontFamily: "Ubuntu",
                },
              },
            ],
          },
          legend: {
            display: false,
          },
          tooltips: {
            enabled: false,
						mode: 'index',
						intersect: false,
						custom: customTooltips
          },
        },
      });
    },
    sendInfoOrder: function () {
      var widget = this;
      // var url = "https://qualidoc.com.br/"+widget.orderProfileId()?"+apiKey=64c43976b7fc4acdb45c50850520408b";
      var url =
        "https://qualidoc.com.br/27221379?apiKey=64c43976b7fc4acdb45c50850520408b";
      // var orderItems = widget.order().items();
      // var quantityItems = orderItems.forEach( function(item){
      //   return quantityItems + item.quantity
      // })
      console.log("quantity", quantityItems);
      var informationOrders = {
        // "clientID": widget.orderProfileId(),
        // "orderID": widget.id(),
        // "orderTotal": widget.priceInfo().total(),
        // "numberOfItems": quantityItems,
        // "itemsTotal": widget.priceInfo().subTotal(),
        // "economyTotal": widget.$data().order().items().dynamicProperties().filter(function(prop){prop.id === "x_averageEconomy"}).value(),
        // "submittedDate": widget.submittedDate()
        clientID: "27221379",
        orderID: "0903751",
        orderTotal: "15.5",
        numberOfItems: "1",
        itemsTotal: "15",
        economyTotal: "44,25",
        submittedDate: "2021-03-09T22:43:02.000Z",
      };
      console.log("informationOrders", informationOrders);
      var options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(informationOrders),
      };
      fetch(url, options).then(function (response) {
        return response.json();
      });
    },
    getInfoOrder: function () {
      var widget = this;
      // var url = "https://qualidoc.com.br/27221379?apiKey=64c43976b7fc4acdb45c50850520408b";
      var getOrders = {
        clientID: "186550601",
        orders: [
          {
            orderID: "0903751",
            orderTotal: "100",
            numberOfItems: "2",
            itemsTotal: "15",
            economyTotal: "44,25",
            submittedDate: "2021-01-12T22:43:02.000Z",
            priceConcurrency: "127",
          },
          {
            orderID: "02013925",
            orderTotal: "9.02",
            numberOfItems: "1",
            itemsTotal: "9.02",
            economyTotal: "6.72",
            submittedDate: "2021-03-11T18:28:11.455Z",
            priceConcurrency: "16.5",
          },
          {
            orderID: "02013925",
            orderTotal: "33.63",
            numberOfItems: "4",
            itemsTotal: "11.21",
            economyTotal: "6.72",
            submittedDate: "2021-03-10T18:28:11.455Z",
            priceConcurrency: "40",
          },
          {
            orderID: "02013925",
            orderTotal: "135.21",
            numberOfItems: "2",
            itemsTotal: "75.21",
            economyTotal: "6.72",
            submittedDate: "2021-03-15T18:28:11.455Z",
            priceConcurrency: "138.5",
          },
        ],
      };
      // var options = {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(getOrders),
      // }
      // fetch(url, options)
      // .then(function (response) {
      //   return console.log("success")
      // })
      var obj = JSON.stringify(getOrders);
      widget.orderInfo(obj);
    },
    calculationOrder: function () {
      var widget = this;
      var orders = widget.orderInfo();
      var obj = JSON.parse(orders);
      var ordersParsed = obj.orders;
      // Total de pedidos
      var totalOrderQualidoc = ordersParsed.map(function (item) {
        var parseTotal = parseFloat(item.orderTotal, item.priceConcurrency);
        var date = item.submittedDate;
        var order = {
          total: parseTotal,
          date: date,
        };
        return order;
      });
      var mediaConcorrente = ordersParsed.map(function (item) {
        var parseTotal = parseFloat(item.priceConcurrency);
        var date = item.submittedDate;
        var order = {
          total: parseTotal,
          date: date,
        };
        return order;
      });
      var totalmediaConcorrente = mediaConcorrente.reduce(function (
        total,
        item
      ) {
        return total + item / totalConcorrente;
      },
      0);
      var totalQualidoc = totalOrderQualidoc.reduce(getTotalOrderQualidoc);
      function getTotalOrderQualidoc(total, item) {
        return total + item;
      }
      var totalConcorrente = mediaConcorrente.length;
      var economy = ordersParsed.map(function (item) {
        var parseTotal = parseFloat(item.economyTotal);
        return parseTotal;
      });
      var totalEconomy = economy.reduce(getTotalEconomy);
      function getTotalEconomy(total, item) {
        return total + item;
      }
      widget.averageEconomy(totalEconomy);
      widget.itemsQualidoc(totalOrderQualidoc);
      widget.itemsConcurrency(mediaConcorrente);
      widget.setDates();
      var totalOrder = ordersParsed.map(function (item) {
        var parseTotal = parseFloat(item.numberOfItems);
        return parseTotal;
      });
      var total = totalOrder.reduce(getTotal);
      widget.totalProducts(total);
      function getTotal(total, item) {
        return total + item;
      }
    },
  };
});