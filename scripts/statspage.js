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
                "grid" : 16,
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

        $('#update_table').html('');

        var d = data.data;

        for (var i = 0; i < d.length; i++) {
            $('#update_table').append('<tr><td>'+d[i].ts+'</td><td>'+d[i].delta+'</td></tr>');
        };

    });




});