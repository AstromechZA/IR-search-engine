var numberWithCommas = function _numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

$(function(){

    $.get("http://people.cs.uct.ac.za/~bmeier/solr_stat.php", function(data, status) {

        // uptime field
        var v = data.status.ndltdcore.uptime / 1000;

        var sec = Math.floor(v % 60);
        var min = Math.floor((v / 60) % 60);
        var hours = Math.floor(v / 3600);

        var uptime = "" + hours + "h " + min + "m " + sec + "s";
        $('#uptime_cell').html(uptime);

        // documents
        var d = data.status.ndltdcore.index.numDocs;
        $('#numDocs_cell').html(numberWithCommas(d));

        // size
        var size = data.status.ndltdcore.index.size;
        $('#size_cell').html(size);

        // last modified
        var ld = data.status.ndltdcore.index.lastModified;
        ld = ld.replace('T', ' ');
        ld = ld.replace('Z', ' ');
        $('#lastModified_cell').html(ld);

    });

    $.get("http://people.cs.uct.ac.za/~bmeier/solr.php?q=*&rows=0&facet=true&facet.field=subject", function(data, status) {

        var d = data.facet_counts.facet_fields.subject;

        for (var i = d.length - 1; i >= 0; i-=2) {
            $('#wordcloudthing').append('<span data-weight="'+d[i]/1000+'">'+d[i-1]+'</span>')
        };
        var settings = {
            "size" : {
                "grid" : 8,
                "factor" : 0,
                "normalize": true
            },
            "options" : {
                "color" : "random-dark",
                "rotationRatio":0
            },
            "font" : "Futura, Helvetica, sans-serif",
            "shape" : "square"
        }

        $('#wordcloudthing').awesomeCloud(settings)

    });

    $.get("http://people.cs.uct.ac.za/~bmeier/solr_update_state.php", function(data, status) {
	
		data.data.reverse();	
	
		var data2 = [];
		var last = 0;		
				
		for(var i=0;i<data.data.length;i+=1) {
			var point = data.data[i];
			last = last + point.delta;
			data2.push([Date.parse(point.ts.replace(' ','T')), last]);
						
		}
		
		var count_chart = new Highcharts.StockChart({
		  chart: {
			renderTo: 'update_graph',
			height: 400
		  },
	  
		  rangeSelector: {
			buttons: [ {
				type: 'week',
				count: 1,
				text: '1w'
			  }, {
				type: 'all',
				text: 'All'
			}],
			selected: 1
		  },
	  
		  xAxis: {
			ordinal: false
		  },
	  
		  yAxis: {
			title: {
			  text: 'Count'
			}
		  },
	  
		  title: {
			text: 'Document count over time'
		  },
	  
		  tooltip: {
			formatter: function() {
				var s = Highcharts.dateFormat('%H:%M - %a, %b %e, %Y', this.x);

				$.each(this.points, function(i, point) {
				  s += '<br><span style="color:'+point.series.color+'; font-weight: bold;">'+point.series.name+':</span> '+numberWithCommas(point.y)+'';
				});

				return s;
			},
			useHTML: true
		  },
	  
		  series: [{
				type: 'line',
				name: 'Documents',
				data: data2
			}]
		});

    });




});
