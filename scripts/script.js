// Helper function to print crossfilters. Used only for testing.
function print_filter(filter) {
	var f=eval(filter);
	if (typeof(f.length) != "undefined") {}else{}
	if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
	if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
	console.log(filter+"("+f.length+") = "+JSON.stringify(f).replace("[","[\n\t").replace(/}\,/g,"},\n\t").replace("]","\n]"));
}

// Define the charts
var agencyChart = dc.barChart('#agencyChart');
var dateChart = dc.barChart('#dateChart');

// Load data
d3.csv('data/ODI_CW1-v5.csv', function(d){
  return {
    agency : d['Agency Name'],
    s_date : new Date(d['Start Date']),
    c_date : new Date(d['Completion Date (B1)']),
    l_cost : +d['Lifecycle Cost']
  };
}, function(data){

  // Create crossfilter
  var cf = crossfilter(data);
  // print_filter(cf);

  // Define dimensions
  var agencyDim = cf.dimension(function(d) { return d.agency; });
  var sDateDim = cf.dimension(function(d) { return d.s_date; });
  var cDateDim = cf.dimension(function(d) { return d.c_date; });
  var lCostDim = cf.dimension(function(d) { return d.l_cost; });

  var min_sDateDim = sDateDim.bottom(1)[0]['s_date'];
  var max_sDateDim = sDateDim.top(1)[0]['s_date'];

  console.log(min_sDateDim);

  // Filter data
  // sDateDim.filter(function(d){ if (d.s_date > new Date('2017-01-01')) return d.s_date; });

  // Define groupings
  var agencyGroup = agencyDim.group();
  var dateGroup = sDateDim.group();
  var lCostGroup = lCostDim.group();
  var costPerAgencyGroup = agencyDim.group().reduceSum(function (d) { return d.l_cost; });

  // Agency Bar Chart
  agencyChart
    // .width()
    .height(300)
    .margins({top: 10, right: 50, bottom: 30, left: 30})
    .dimension(agencyDim)
    .group(costPerAgencyGroup)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    // .yUnits(dc.units.integers)
    .xAxisLabel('Agency')
    .yAxisLabel('#Records')
    .elasticY(true)
    // .elasticX(true)
    // .xAxisPadding(20)
    // .gap()
    // .barPadding()
    // .outerPadding(4)
    // .yAxis().ticks()
    .controlsUseVisibility(true);
    ;

    agencyChart.yAxis().tickFormat(d3.format("d"));

    // Date Bar Chart
    dateChart
      // .width()
      .height(200)
      .dimension(sDateDim)
      .group(dateGroup)
      .x(d3.time.scale().domain([min_sDateDim, max_sDateDim]))
      .xUnits(d3.time.years)
      .xAxisLabel('Start Date')
      .yAxisLabel('#Records')
      .elasticY(true)
      // .elasticX(true)
      // .xAxisPadding(20)
      // .gap()
      // .barPadding()
      // .outerPadding(4)
      // .yAxis().ticks()
      .controlsUseVisibility(true);
      ;

    dc.renderAll();

});
