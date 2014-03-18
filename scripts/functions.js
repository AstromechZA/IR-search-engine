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




// Start Position refers to the position at which the documents to be queried should start from
function getAndAppendSearchResults(query, startPosition, faceted){
	
	//replace spaces with %20
	query = query.replace(/ /g,"%20");
	
	if (query != ''){
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
					//alert(data.highlighting);
					//console.log(data.highlighting);
					searchResults += '<div id="documentDetails:' + documentNumber + '" class="show" style="padding-bottom:10px; width: 570px; float:left;"><a class="link" href="' + val.identifier + '">' + (val.title+'').trunc(67) + '</a><br />'; 
					longSearchResults += '<div class="hide" id="documentDetailsLong:' + documentNumber + '" style=" padding-bottom:10px; width: 570px; float:left;"><a class="link" href="' + val.identifier + '">' + val.title + '</a><br />'; 					
					if (val.author != '' && typeof(val.author) != 'undefined'){
						searchResults += '<span class="authors">' + val.author;
						longSearchResults += '<span class="authors">' + val.author;
						if (val.date != '' && typeof(val.date) != 'undefined'){
							searchResults += ' - ' + (val.date+'').substring(0, 4);
							longSearchResults += ' - ' + (val.date+'').substring(0, 10);
						}
						
						searchResults += '</span><br />'; 
						longSearchResults += '</span><br />'; 
					}
					
					if (val.description != '' && typeof(val.description) != 'undefined'){
						searchResults += (val.description+'').trunc(250) + '<br />';
						longSearchResults += val.description + '<br />';
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
		
					$('#documentStatus').html("currently showing 1-"+ Math.min(10, data.response.numFound) + " of " + data.response.numFound + " documents");
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
									$('#documentStatus').html("currently showing " + pageStart + "-" + numDocuments + " of " + data.response.numFound + " documents");
								}
								else{
									var pageTo = parseInt(pageNumber*10)+parseInt(10);
									$('#documentStatus').html("currently showing " + pageStart + "-" + Math.min(pageTo, data.response.numFound) + " of " + data.response.numFound + " documents");
								}
								getAndAppendSearchResults(query, pageNumber*10, false);		
							}
						});
					});	
					
				}
			}
			
		});
	}
	
	$('#footer').css('position', "relative");
	$('#footer').css('margin-right', "120px");

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

	$('#footer').css('position', "fixed");
	$('#footer').css('margin-left', "120px");

	$("#autocomplete").keyup(function(){
		//Get value of the entire input field
		var dInput = $(this).val();
		
		if(dInput == ""){
			$("#facet_content").empty();
			$("#pagination").pagination('destroy');
			$('#documentStatus').html("");
			$('#footer').css('position', "fixed");
			$('#footer').css('margin-left', "120px");
			
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
		
		if (inputQuery != ''){
			
			getAndAppendSearchResults(inputQuery, 0, false);

			$.get("http://people.cs.uct.ac.za/~bmeier/solr.php?q="+inputQuery+"&facet=true&facet.limit=5&facet.field=language&facet.field=subject&facet.field=date",function(data,status){
	
				var numPages = Math.min(Math.ceil(data.response.numFound / 10.0), 100)-1;
				
				if(data.response.docs.length > 0){
				
					$('#documentStatus').html("currently showing 1-"+ Math.min(10, data.response.numFound) + " of " + data.response.numFound + " documents");
				
					// Pagination
					$(function() {
						$("#pagination").pagination({
							pages: numPages,
							cssStyle: 'light-theme',
							onPageClick: function(pageNumber, event){
								var pageTo = parseInt(pageNumber*10)+parseInt(10);
								if (pageNumber < numPages){
									var pageStart = parseInt(pageNumber*10)+parseInt(1);
									$('#documentStatus').html("currently showing " + pageStart + "-" + Math.min(pageTo, data.response.numFound) + " of " + data.response.numFound + " documents");
								}
								else{
									$('#documentStatus').html("currently showing " + pageStart + "-" + data.response.numFound + " of " + data.response.numFound + " documents");
								}
								getAndAppendSearchResults(inputQuery, pageNumber*10, false);		
							}
						});
					});	
				
				
					// Get Language, publisher, date Facet categories
					var languageFacets = '';
					var subjectFacets = '';
					var dateFacets = '';
					
					var languageLength = Math.min(data.facet_counts.facet_fields.language.length, 10);
					for (var t=0; t< languageLength; t+=2){
							languageFacets += "<li><label><input type='checkbox' value='language:"+data.facet_counts.facet_fields.language[t]+"'>"+data.facet_counts.facet_fields.language[t]+ ' ('+data.facet_counts.facet_fields.language[t+1]+')</label><br></li>';
					}	
					
					var dateLength = Math.min(data.facet_counts.facet_fields.date.length, 10);
					for (var t=0; t< dateLength; t+=2){
							dateFacets += "<li><label><input type='checkbox' value='date:"+data.facet_counts.facet_fields.date[t]+"'>"+(data.facet_counts.facet_fields.date[t]+'').substring(0, 4)+ ' ('+data.facet_counts.facet_fields.date[t+1]+')</label><br></li>';				
					}
					
					var subjectLength = Math.min(data.facet_counts.facet_fields.subject.length, 10);
					for (var t=0; t< subjectLength; t+=2){
						subjectFacets += "<li><label><input type='checkbox' value='subject:"+data.facet_counts.facet_fields.subject[t]+"'>"+data.facet_counts.facet_fields.subject[t]+ ' ('+data.facet_counts.facet_fields.subject[t+1]+')</label><br></li>';
					}
					
					// FACET SIDEBAR
					//------------------------------------------------------------------------------------------------------------------------------
					$('#facet_content').html(
					
					"<div class='facet' style='border: 1px solid #aaa; width: 190px; text-align: center; color: #3399ff;'>Refine Search</div>"+
					"<div>"+
						"<a href='javascript:;' class='clickMe facet'>Language <span class='arrow arrow_change'></span></a>" +
						"<div class='clickEvent hide' style='border-right: 1px solid #aaa; border-left: 1px solid #aaa; width: 190px;'>" +
						" <ul>"+ languageFacets + "</ul>"+					
						"</div>"+   
					"</div>"+
					"<div>"+
						"<a href='javascript:;' class='clickMe facet'>Date <span class='arrow arrow_change'></span></a>" +
						"<div class='clickEvent hide' style='border-right: 1px solid #aaa; border-left: 1px solid #aaa; width: 190px;'>" +
						" <ul>"+ dateFacets + "</ul>"+					
						"</div>"+   
					"</div>"+
					"<div>"+
						"<a href='javascript:;' class='clickMe facet'>Subject <span class='arrow arrow_change'></span></a>"+
						"<div id='TEST' class='clickEvent hide' style='border: 1px solid #aaa; width: 190px;'>"+
							"<ul>"+ subjectFacets + "</ul>"+
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
				}
			
			});
		}
		//------------------------------------------------------------------------------------------------------------------------------
		$('#footer').css('position', "relative");
		$('#footer').css('margin-right', "120px");
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



$("button").click(function(){
  $("p").toggle();
});