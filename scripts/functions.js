// Truncate long urls with string.trunc(length)
String.prototype.trunc = String.prototype.trunc || function(n){
  return this.length> n ? this.substr(0,n-1)+'&hellip;' : this;
};

function getSelectedFacets()
{
	var selectedFacets=new Array();
	var count = 0;
	
	$('.list-group-item input:checkbox').each(function () {
		if (this.checked){
			selectedFacets[count] = $(this).val();
			count++;
		}
	});
	return selectedFacets;
}


function toggleInfo(docNumber){

	var currentClassOfDocumentDetails = document.getElementById("documentDetails:"+docNumber).className;
	var currentClassOfDocumentDetailsLong = document.getElementById("documentDetailsLong:"+docNumber).className;
	
	if (currentClassOfDocumentDetails == "show"){
		document.getElementById("documentDetails:"+docNumber).className = "hide";
		document.getElementById("documentDetailsLong:"+docNumber).className = "show";	
	}
	else{
		document.getElementById("documentDetails:"+docNumber).className = "show";
		document.getElementById("documentDetailsLong:"+docNumber).className = "hide";
	}

}

var langcodes = {
	'ar':'Arabic',
	'bg':'Bulgarian',
	'ca':'Catalan',
	'cz':'Czech',
	'da':'Danish',
	'de':'German',
	'el':'Greek',
	'en':'English',
	'es':'Spanish',
	'eu':'Basque',
	'fa':'Persian',
	'fi':'Finnish',
	'fr':'French',
	'ga':'Irish',
	'gl':'Galician',
	'hi':'Hindi',
	'hu':'Hungarian',
	'hy':'Armenian',
	'id':'Indonesian',
	'it':'Italian',
	'ja':'Japanese',
	'lv':'Latvian',
	'nl':'Dutch',
	'no':'Norwegian',
	'pt':'Portuguese',
	'ro':'Romanian',
	'ru':'Russian',
	'sv':'Swedish',
	'th':'Thai',
	'tr':'Turkish',
	'general':'General'
};
function translateShortLangToLong(shortform) {
	return langcodes[shortform];
}

// Start Position refers to the position at which the documents to be queried should start from
function getAndAppendSearchResults(query, startPosition, faceted){
	//replace spaces with %20
	query = query.replace(/ /g,"%20");
	
	if (query != ''){
		$('#search-title').show();
		// Get search data
		$.get("http://people.cs.uct.ac.za/~bmeier/solr.php?q="+query+"&start="+startPosition,function(data,status){
			var searchResults = '<div>';
			// Loop through each doc
			var documents = data.response.docs;
			
			var documentNumber = 0;
			var maxDocumentsPerPage = 10;		
			maxDocumentsPerPage = Math.min(documents.length, 10);

			var longSearchResults = '';
			var resultsFound = true;
			
			if(documents.length > 0){
				jQuery.each( documents, function( i, val ) {
					documentNumber++;
					
					// Highlight Description or Normal Description
					//--------------------------------------------
					var documentId = val.id;
					var detectedLanguage = val.detectedlanguage;				
					var highlightedDescription = data.highlighting[documentId+'']['description_'+detectedLanguage];
					
					// If highlighted description is undefined set it to the normal description
					if (typeof(highlightedDescription) == 'undefined'){
						highlightedDescription = val.description;
					}
					//--------------------------------------------
					
					searchResults += '<div id="documentDetails:' + documentNumber + '" class="show" style="padding-bottom:10px;"><a class="link" href="' + val.identifier + '">' + (val.title+'').trunc(67) + '</a><br />'; 
					longSearchResults += '<div class="hide" id="documentDetailsLong:' + documentNumber + '" style=" padding-bottom:10px;"><a class="link" href="' + val.identifier + '">' + val.title + '</a><br />'; 					
					if (val.author != '' && typeof(val.author) != 'undefined'){
						searchResults += '<span class="authors">' + val.author;
						longSearchResults += '<span class="authors">' + val.author;
						if (val.date != '' && typeof(val.date) != 'undefined'){
							searchResults += ' - ' + (val.date+'').substring(0, 4) + '<span style="padding-left:40px;">' + val.detectedlanguage +'</span>';
							longSearchResults += ' - ' + (val.date+'').substring(0, 10) + '<span style="padding-left:40px;">' + val.detectedlanguage +'</span>';
						}
						
						searchResults += '</span><br />'; 
						longSearchResults += '</span><br />'; 
					}
					
					if (highlightedDescription != '' && typeof(highlightedDescription) != 'undefined'){
						searchResults += (highlightedDescription+'').trunc(250) + '<br />';
						longSearchResults += highlightedDescription + '<br />';
					}

					
					searchResults += '<span class="identifier">' + (val.identifier+'').trunc(50) + '</span></div>';
					longSearchResults += '<span class="identifier">' + val.identifier + '</span></div>';
					searchResults += longSearchResults + '<div style="width:30px; height: 20px; padding-top: 2px; float:right;"><a href="javascript:;" class="dropdown"><div class="arrow_document arrow_change" onClick="toggleInfo(' + documentNumber + ')"></div></a></div>';
					longSearchResults = '';
				});
			}else{
				resultsFound = false;
				searchResults += '<p>No results found.</p>';
				$("#pagination").pagination('destroy');
			}
			searchResults += '</div>';
			
			
				$('#info_and_search_content').html(searchResults);
				
					// Change arrows on documents
				$('.dropdown').toggle(function() {
					$(this).children().removeClass('arrow_change');
					}, function() {
						$(this).children().addClass('arrow_change');
				});
				
			if (resultsFound){	
				// If the user has faceted the query, re-paginate and getAndAppendSearchResults
				if (faceted){
		
					$('#documentStatus').html("<h5>Displaying 1-"+ Math.min(10, data.response.numFound) + " of " + data.response.numFound + " documents.</h5>");
					var numDocuments = Math.min(Math.ceil(data.response.numFound / 10.0), 100)-1;
					
					$("#pagination").pagination('destroy');
					
					// Pagination
					$(function() {
						$("#pagination").pagination({
							pages: numDocuments,
							cssStyle: 'light-theme',
							onPageClick: function(pageNumber, event){	
								var pageStart = parseInt(pageNumber*10)+parseInt(1);						
								if (pageNumber > numDocuments){
									$('#documentStatus').html("<h5>Displaying " + pageStart + "-" + numDocuments + " of " + data.response.numFound + " documents.</h5>");
								}
								else{
									var pageTo = parseInt(pageNumber*10)+parseInt(10);
									$('#documentStatus').html("<h5>Displaying " + pageStart + "-" + Math.min(pageTo, data.response.numFound) + " of " + data.response.numFound + " documents.</h5>");
								}
								getAndAppendSearchResults(query, pageNumber*10, false);		
							}
						});
					});	
					
				}
			}
			
		});
	}
}

function applyFilters() {
	var filters = {};
	
	$.each(getSelectedFacets(), function( index, value ) {
		var filter = value.indexOf(':');
		var key = value.slice(0, filter);
		var val = value.slice(filter+1);
		
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
	
	// Check if there is a date range filter in play
	//-----------------------------------------------------------------
	//Ensure that startDate is in the correct format
	var filter = new RegExp("([1-2][0-9][0-9][0-9])");

	var startDateVal = $("#startDate").val();
	var endDateVal = $("#endDate").val();

	var dateRangeQuery = '';
	
	if(filter.test(startDateVal) && filter.test(endDateVal)){							
		// Use start and end Year to do a range query
		dateRangeQuery = '&fq=date:['+startDateVal+'-01-01T00:00:00Z'+' TO '+endDateVal+'-12-31T00:00:00Z'+']';
	}
	//-----------------------------------------------------------------
	
	getAndAppendSearchResults(queryString+dateRangeQuery, 0, true);
}



function getCurrentFilters(){
	var filters = {};
	
	$.each(getSelectedFacets(), function( index, value ) {
		var filter = value.indexOf(':');
		var key = value.slice(0, filter);
		var val = value.slice(filter+1);
		
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
	
	return $('#autocomplete').val()+facetString; 
}


$(document).ready(function(){

	$("#autocomplete").keyup(function(){
		//Get value of the entire input field
		var dInput = $(this).val();
		
		if(dInput == ""){
			$("#facet_content").empty();
			$("#pagination").pagination('destroy');
			$('#documentStatus').html("");
			$('#search-title').hide();
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
	
	$('#search_form').submit(function(event) {
		event.preventDefault();
		
		//get value of the entire input field
		var inputQuery = $('#autocomplete')[0].value;
		
		if (inputQuery != ''){
			
			getAndAppendSearchResults(inputQuery, 0, false);

			$.get("http://people.cs.uct.ac.za/~bmeier/solr.php?q="+inputQuery+"&facet=true&facet.limit=5&facet.field=detectedlanguage&facet.field=subject",function(data,status){
	
				var numPages = Math.min(Math.ceil(data.response.numFound / 10.0), 100)-1;
				
				if(data.response.docs.length > 0){
				
					$('#documentStatus').html("<h5>Displaying 1-"+ Math.min(10, data.response.numFound) + " of " + data.response.numFound + " documents.</h5>");
				
					// Pagination
					$(function() {
						$("#pagination").pagination({
							pages: numPages,
							cssStyle: 'light-theme',
							onPageClick: function(pageNumber, event){
								var pageTo = parseInt(pageNumber*10)+parseInt(10);
								if (pageNumber < numPages){
									var pageStart = parseInt(pageNumber*10)+parseInt(1);
									$('#documentStatus').html("<h5>Displaying " + pageStart + "-" + Math.min(pageTo, data.response.numFound) + " of " + data.response.numFound + " documents.</h5>");
								}
								else{
									$('#documentStatus').html("<h5>Displaying " + pageStart + "-" + data.response.numFound + " of " + data.response.numFound + " documents.</h5>");
								}
								getAndAppendSearchResults(inputQuery, pageNumber*10, false);		
							}
						});
					});	
				
				
					// Get Language, publisher, date Facet categories
					var languageFacets = '';
					var subjectFacets = '';
					
					var languageLength = Math.min(data.facet_counts.facet_fields.detectedlanguage.length, 10);
					for (var t=0; t< languageLength; t+=2){
						if (data.facet_counts.facet_fields.detectedlanguage[t+1] > 0) {
							languageFacets += "<li class='list-group-item'><label class='plain'><input type='checkbox' onClick='applyFilters()' value='detectedlanguage:"+data.facet_counts.facet_fields.detectedlanguage[t]+"'> "+translateShortLangToLong(data.facet_counts.facet_fields.detectedlanguage[t])+ '</label><span class="badge">'+data.facet_counts.facet_fields.detectedlanguage[t+1]+'</span></li>';
						}
					}	
					
					var subjectLength = Math.min(data.facet_counts.facet_fields.subject.length, 10);
					for (var t=0; t< subjectLength; t+=2){
						if (data.facet_counts.facet_fields.subject[t+1] > 0) {
							subjectFacets += "<li class='list-group-item'><label class='plain'><input type='checkbox' onClick='applyFilters()' value='subject:"+data.facet_counts.facet_fields.subject[t]+"'> "+data.facet_counts.facet_fields.subject[t]+ '</label><span class="badge">'+data.facet_counts.facet_fields.subject[t+1]+'</span></li>';
						}
					}
					
					// FACET SIDEBAR
					$('#facet_content').html(
					
					"<div class='page-header'><h3>Refine search</h3></div>"+
					"<ul class='list-group'>"+
						"<li class='list-group-item' style='background-color: #dd4814; border-color: #dd4814; color: #fff;'>Language</li>" +
						languageFacets +   
					"</ul>"+
					"<ul class='list-group'>"+
						"<li class='list-group-item' style='background-color: #dd4814; border-color: #dd4814; color: #fff;'>Date</li>" +
						"<li class='list-group-item-date-range'><form class='form-inline'><input id='startDate' class='form-control input-sm date-input' type='text' maxlength='4' size='5' placeholder='Year' style='width: 50px;'> to <input id='endDate' class='form-control input-sm date-input' type='text' maxlength='4' size='5' placeholder='Year' style='width: 50px;'><a id='dateRangeSubmit' class='btn btn-primary btn-sm' style='float:right;'>Update</a></form><div id='rangeStatus'></div></li>" +
					"</ul>"+
					"<ul class='list-group'>"+
						"<li class='list-group-item' style='background-color: #dd4814; border-color: #dd4814; color: #fff;'>Subject</li>" +
						subjectFacets +  
					"</ul>");

					$('.clickMe').toggle(function() {
						$(this).parent().find("div:eq(0)").slideDown("fast");
						$(this).children().removeClass('arrow_change');
						}, function() {
							$(this).parent().find("div:eq(0)").slideUp("fast");
							$(this).children().addClass('arrow_change');
					});
					
					$("#dateRangeSubmit").click(function(){  

						//Ensure that startDate is in the correct format
						var filter = new RegExp("([1-2][0-9][0-9][0-9])");

						var startDateVal = $("#startDate").val();
						var endDateVal = $("#endDate").val();

						if(filter.test(startDateVal) && filter.test(endDateVal)){							
							$("#rangeStatus").html('');
							// Use start and end Year to do a range query
							var dateRangeQuery = '&fq=date:['+startDateVal+'-07-01T00:00:00Z'+' TO '+endDateVal+'-07-01T00:00:00Z'+']';
							getAndAppendSearchResults(getCurrentFilters()+dateRangeQuery, 0, true);
						}
						else{
							$("#rangeStatus").html('Invalid Date Range!');
							
						}

					});
				}
			
			});
		}
		
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



