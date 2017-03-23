// Helper function to print crossfilters. Used only for testing.
function print_filter(filter) {
    var f = eval(filter);
    if (typeof(f.length) != "undefined") {} else {}
    if (typeof(f.top) != "undefined") {
        f = f.top(Infinity);
    } else {}
    if (typeof(f.dimension) != "undefined") {
        f = f.dimension(function(d) {
            return "";
        }).top(Infinity);
    } else {}
    console.log(filter + "(" + f.length + ") = " + JSON.stringify(f).replace("[", "[\n\t").replace(/}\,/g, "},\n\t").replace("]", "\n]"));
}

// Format numbers for money
var formatNumber = d3.format("$.2f");
var formatBillion = function(x) { return formatNumber(x / 1e3) + "B"; };
var formatMillion = function(x) { return formatNumber(x) + "M"; };

function formatMoney(x) {
  var num = Math.round(x);
  return (num >= 1000 ? formatBillion
  : formatMillion)(x);
}



// Define the charts
var agencyChart = dc.barChart('#agencyChart');
var dateChart = dc.barChart('#dateChart');
// var seriesChart = dc.seriesChart("#seriesChart");

// Define counter for selection
var counter = dc.numberDisplay('#counter');
var counterCount = dc.dataCount('#counterCount');

// Define some public variables related with crossfilters
var agencyGroup, costPerAgencyGroup;

function setAgency(option) {
    if (option == 'count') {
        agencyChart.group(agencyGroup);
        agencyChart.yAxis().tickFormat(d3.format("d"));
        agencyChart.yAxisLabel('# Projects')
    } else {
        agencyChart.group(costPerAgencyGroup);
        agencyChart.yAxis().tickFormat(d3.format("$.0f"));
        agencyChart.yAxisLabel('Cost ($B)')
    }
    dc.redrawAll();
};

// Set listeners
$(document).ready(function() {


    $('input[name=agency]').on('change', function() {
        console.log($(this).val());
        if ($('input[name=agency]:checked').val() == 'count') {
            setAgency('count');
        } else {
            setAgency('cost');
        }
    });
});

// Load data
d3.csv('data/ODI_CW1-v5.csv', function(d) {
    s_date = new Date(d['Start Date']);
    c_date = new Date(d['Completion Date (B1)']);
    return {
        agency: d['Agency Name'],
        s_date: s_date,
        c_date: c_date,
        l_cost: +d['Lifecycle Cost'],
    };
}, function(data) {

    // Reduce data for testing purposes
    // data = data.slice(0,100);

    // Create crossfilter
    var cf = crossfilter(data);

    // Define dimensions
    var agencyDim = cf.dimension(function(d) {
        return d.agency;
    });
    var sDateDim = cf.dimension(function(d) {
        return d3.time.year(d.s_date);
    });
    var cDateDim = cf.dimension(function(d) {
        return d.c_date;
    });
    var lCostDim = cf.dimension(function(d) {
        return d.l_cost;
    });

    var min_sDateDim = sDateDim.bottom(1)[0]['s_date'];
    var max_sDateDim = sDateDim.top(1)[0]['s_date'];

    var firstDate = sDateDim.bottom(1)[0]['s_date'];
    var lastDate = cDateDim.top(1)[0]['c_date'];

    // Define groupings
    var all = cf.groupAll();
    agencyGroup = agencyDim.group();
    var sdateGroup = sDateDim.group();
    var lCostGroup = lCostDim.group();
    costPerAgencyGroup = agencyDim.group().reduceSum(function(d) {
        return d.l_cost / 1000.0;
    });

    // Agency Bar Chart
    agencyChart
    // .width()
        .height(300)
        .margins({
            top: 10,
            right: 50,
            bottom: 30,
            left: 30
        })
        .dimension(agencyDim)
        .group(agencyGroup)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel('Agency')
        .yAxisLabel('# Projects')
        .elasticY(true)
        .controlsUseVisibility(true);;

    agencyChart.yAxis().tickFormat(d3.format("d"));

    // agencyChart listener
    agencyChart.on('renderlet', function(chart, filter){
      console.log(groupAllCostSum.value());
    });

    // Date Bar Chart
    dateChart
    // .width()
        .height(200)
        .dimension(sDateDim)
        .group(sdateGroup)
        .x(d3.time.scale().domain([min_sDateDim, max_sDateDim]))
        .xUnits(d3.time.years)
        .xAxisLabel('Date')
        .yAxisLabel('# Projects')
        .elasticY(true)
        .controlsUseVisibility(true);

    // Implement counter for selection
    var groupAllCostSum = cf.groupAll().reduceSum(function(d) { return d.l_cost; });

    counter
      .dimension({})
      .group(groupAllCostSum)
      .formatNumber(formatMoney)
      .valueAccessor(function(x) { return x; });

    counter.on('postRender', function () {
        d3.select('#counter-text').style('display', 'inline');
    });

    counterCount
        .dimension(cf)
        .group(all)
        .html({
            some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'>Reset All</a>',
            all: 'All records selected.'
        });

    dc.renderAll();

});
