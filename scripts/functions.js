// Truncate long urls with string.trunc(length)
String.prototype.trunc = String.prototype.trunc || function(n){
  return this.length> n ? this.substr(0,n-1)+'&hellip;' : this;
};

function getSelectedFacets()
{
	var selectedFacets=new Array();
	var count = 0;
	
	$('.clickEvent.hide input:checkbox').each(function () {
		if (this.checked){
			selectedFacets[count] = $(this).val();
			count++;
		}
	});
	return selectedFacets;
}

// Start Position refers to the position at which the documents to be queried should start from
function getAndAppendSearchResults(query, startPosition, faceted){
	
	//replace spaces with %20
	query = query.replace(/ /g,"%20");
	// Get search data
	$.get("http://people.cs.uct.ac.za/~bmeier/solr.php?q="+query+"&start="+startPosition,function(data,status){
		var searchResults = '<div>';
		// Loop through each doc
		var documents = data.response.docs;
		if(documents.length > 0){
			jQuery.each( documents, function( i, val ) {
				searchResults += '<div style="padding-bottom:10px;"><a class="link" href="'+val.identifier+'">'+(val.title+'').trunc(72) + '</a><br /><span class="authors">' + val.author + ' - ' + (val.date+'').substring(0, 4) + '</span><br />'+ (val.description+'').trunc(250) + '<br /><span class="identifier">' + (val.identifier+'').trunc(50) + '</span></div><br>';
			});
		}else{
			searchResults += '<p>No results found.</p>';
		}
		searchResults += '</div>';
		
		$('#info_and_search_content').html(searchResults);
		
		// If the user has faceted the query, re-paginate and getAndAppendSearchResults
		if (faceted){
			var numDocuments = Math.min(Math.ceil(data.response.numFound / 10.0), 100);
			
			$("#pagination").pagination('destroy');
			
			// Pagination
			$(function() {
				$("#pagination").pagination({
					pages: numDocuments,
					cssStyle: 'light-theme',
					onPageClick: function(pageNumber, event){
						getAndAppendSearchResults(query, pageNumber*10, false);		
					}
				});
			});	
			
		}
		
	});
}

// Get the current statistics of the journal archive
function getAndAppendStats(){

	$.get("http://people.cs.uct.ac.za/~bmeier/solr_stat.php",function(data,status){

		$('#info_and_search_content').html(
			"<div  style='line-height: 22px; text-align: center;'>" +
				"<b>Last Modified: </b>"+jQuery.timeago((data.status.ndltdcore.index.lastModified).split('T')[0])+"<br />" +
				"<b>Number of Articles:</b> " + data.status.ndltdcore.index.numDocs +
			"</div>"
		);
	});		
}


$(document).ready(function(){

	$("#autocomplete").keyup(function(){
		//Get value of the entire input field
		var dInput = $(this).val();
		
		if(dInput == ""){
			$("#facet_content").empty();
			$("#pagination").pagination('destroy');
			getAndAppendStats();
		}		
	});
	
	$('#autocomplete').autocomplete({
		serviceUrl: 'http://people.cs.uct.ac.za/~bmeier/solr_suggest.php',
		onSelect: function (suggestion) {
		  $("#search_form").submit();
		},
		transformResult: function(response, originalQuery){
			var results = response.spellcheck.suggestions;
			var a = [];
			
			if(results.length > 0){
				var endIndex;
				var collation = ''
				
				if(results[results.length-2] == 'collation'){
					endIndex = results.length-2;
					a.push({value: results[results.length-1], data: results[results.length-1]});
					collation = results[results.length-1];
				}else{
					endIndex = results.length;
				}
				
				for(var i=0; i < endIndex; i++){
					if(i%2 == 1){
						if(typeof results[i] != 'string'){
							for(var j=0; j < results[i].suggestion.length; j++){
								if(results[i].suggestion[j] != collation){
									a.push({value: results[i].suggestion[j], data: results[i].suggestion[j]});
								}
							}
						}
					}
				}
			}
			
			return {query: originalQuery, suggestions: a};
		},
		dataType: 'jsonp'
	});
	
	$('#search_form').submit(function() {
		event.preventDefault();
		//get value of the entire input field
		var inputQuery = this['autocomplete'].value;
		
		getAndAppendSearchResults(inputQuery, 0, false);

		$.get("http://people.cs.uct.ac.za/~bmeier/solr.php?q="+inputQuery+"&facet=true&facet.limit=5&facet.field=language&facet.field=publisher&facet.field=date",function(data,status){

			//alert(data.facet_counts.facet_fields.language);
			//alert(data.facet_counts.facet_fields.publisher);
			//alert(data.facet_counts.facet_fields.date);
		
			var numDocuments = data.response.numFound;
			if (data.response.numFound > 100){
				numDocuments = 100;
			}
		
			// Pagination
			$(function() {
				$("#pagination").pagination({
					pages: numDocuments,
					cssStyle: 'light-theme',
					onPageClick: function(pageNumber, event){
						getAndAppendSearchResults(inputQuery, pageNumber*10, false);		
					}
				});
			});	
		
		
			// Get Language, publisher, date Facet categories
			var languageFacets = '';
			var publisherFacets = '';
			var dateFacets = '';
			
			for (var t=0; t<10; t+=2){
				languageFacets += "<li><label><input type='checkbox' value='language:"+data.facet_counts.facet_fields.language[t]+"'>"+data.facet_counts.facet_fields.language[t]+ ' ('+data.facet_counts.facet_fields.language[t+1]+')</label><br></li>';
				dateFacets += "<li><label><input type='checkbox' value='date:"+data.facet_counts.facet_fields.date[t]+"'>"+(data.facet_counts.facet_fields.date[t]+'').substring(0, 4)+ ' ('+data.facet_counts.facet_fields.date[t+1]+')</label><br></li>';				
				publisherFacets += "<li><label><input type='checkbox' value='publisher:"+data.facet_counts.facet_fields.publisher[t]+"'>"+data.facet_counts.facet_fields.publisher[t]+ ' ('+data.facet_counts.facet_fields.publisher[t+1]+')</label><br></li>';
				
			}
			
			// FACET SIDEBAR (Temporary placeholder code)
			//------------------------------------------------------------------------------------------------------------------------------
			$('#facet_content').html(
			
			"<div class='facet' style='border: 1px solid #aaa; width: 190px; text-align: center; color: #3399ff;'>Refine Search</div>"+
			"<div>"+
				"<a href='javascript:;' class='clickMe facet'>Language <span class='arrow arrow_change'></span></a>" +
				"<div class='clickEvent hide' style='border-right: 1px solid #aaa; border-left: 1px solid #aaa; width: 190px;'>" +
				" <ul>"+ 
				languageFacets + "</ul>"+					
				"</div>"+   
			"</div>"+
			"<div>"+
				"<a href='javascript:;' class='clickMe facet'>Date <span class='arrow arrow_change'></span></a>" +
				"<div class='clickEvent hide' style='border-right: 1px solid #aaa; border-left: 1px solid #aaa; width: 190px;'>" +
				" <ul>"+ dateFacets + "</ul>"+					
				"</div>"+   
			"</div>"+
			"<div>"+
				"<a href='javascript:;' class='clickMe facet'>Publisher <span class='arrow arrow_change'></span></a>"+
				"<div id='TEST' class='clickEvent hide' style='border: 1px solid #aaa; width: 190px;'>"+
					"<ul>"+ publisherFacets + "</ul>"+
				"</div>"+
			"</div>	");
		
			$('.clickEvent.hide input:checkbox').click(function(){	
				var filters = {};
				
				$.each(getSelectedFacets(), function( index, value ) {
					var filter = value.split(':');
					var key = filter[0];
					var val = filter[1];
					
					if(filters[key] == null)
						filters[key] = [];
						
					filters[key].push(val);					
				});
				
				var facetString = '';
				$.each(filters, function(index, value){
					facetString += '&fq=' + index + ':(';
					for(var i=0; i < value.length; i++){
						if(i != 0)
							facetString += ' ';
						facetString += value[i];
					}
					facetString += ')';
				});
				
				var queryString = $('#autocomplete').val()+facetString;
				//alert(queryString);
				getAndAppendSearchResults(queryString, 0, true);
			});

			$('.clickMe').toggle(function() {
				$(this).parent().find("div:eq(0)").slideDown("fast");
				$(this).children().removeClass('arrow_change');
				}, function() {
					$(this).parent().find("div:eq(0)").slideUp("fast");
					$(this).children().addClass('arrow_change');
			});
		
		});
		//------------------------------------------------------------------------------------------------------------------------------
		
		return false;
	});
		
		

});


// Placeholder functions

function unsetPlaceholder(textarea){
	if (textarea.placeholder=='What can we help you find?'){textarea.placeholder='';return false;}
}

function setPlaceholder(textarea){
	if (textarea.placeholder==''){textarea.placeholder='What can we help you find?';return false;}
}