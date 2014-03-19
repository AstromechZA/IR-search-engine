<?php


echo '
<h3>Some useful tips to improve your search results:</h3>
<table class="table table-bordered table-striped table-condensed" style="padding-bottom:10px;" >
	<tr>
	  <th><b>Query </b></th>
	  <td><b>Displays documents:</b></td>
	  
	</tr>
	<tr>
		<th>subject:”visualisation”</th>
		<td> where the subject includes the word “visualisation"</td>
	</tr>
	<tr>
		<th>title:”computers”</th>
		<td> where the title includes the word "computer"</td>
	</tr>
	<tr>
		<th>author:”Hussein, Saladman”</th>
		<td> where the author is “Hussein, Saladman”</td>
	</tr>
	<tr>
		<th>description:”water rates”</th>
		<td> where the description includes “water rates”</td>
	</tr>
	<tr>
		<th>publisher:"McGill University"</th>
		<td> where the publisher is “McGill University”</td>
	</tr>
	<tr>
		<th>language:”english”</th>
		<td> where the language is “english”</td>
	</tr>
	<tr>
		<th>apples AND bananas</th>
		<td> that contain both "apples" and "bananas"</td>
	</tr>
	<tr>
		<th>apples NOT bananas</th>
		<td> that contain "apples" and do not contain "bananas"</td>
	</tr>
</table>
<h3>Documents are returned in the following form:</h3>
<table class="table table-bordered table-striped table-condensed" >
	<td>
		<span style="color: #324FE1;font-weight: bold;">Title</span><br>
		<span style="color: #1e0fbe;"> Authors - Year - Document Language</span><br>
		 Description <br>
		<span style="color: #009030;">URL</span><br>
		</div>
	</td>
</table>
';


?>

