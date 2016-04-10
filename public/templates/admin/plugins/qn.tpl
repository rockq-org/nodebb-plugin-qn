<h1>Qiniu</h1>
<form class="form">
	<div class="row">
		<div class="col-sm-4 col-xs-12">
			<div class="form-group">
				<input id="accessKey" type="text" class="form-control" placeholder="Enter accessKey" value="{settings.accessKey}">
				<input id="secretKey" type="text" class="form-control" placeholder="Enter secretKey" value="{settings.secretKey}">
				<input id="bucket" type="text" class="form-control" placeholder="Enter bucket name" value="{settings.bucket}">
				<input id="origin" type="text" class="form-control" placeholder="Enter origin" value="{settings.origin}">
			</div>
		</div>
	</div>
</form>
<button class="btn btn-primary" id="save">Save</button>
<input id="csrf_token" type="hidden" value="{csrf}" />

<script type="text/javascript">
	$('#save').on('click', function() {
		var data = {
			_csrf : $('#csrf_token').val(), 
			accessKey : $('#accessKey').val(),
			secretKey : $('#secretKey').val(),
			bucket : $('#bucket').val(),
			origin : $('#origin').val()
		}
		$.post('/api/admin/plugins/qn/save', data, function(result) {
			app.alertSuccess(result.message);
		});
		return false;
	});
</script>