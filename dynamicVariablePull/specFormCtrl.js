// The additions were built using info from case #127497 by Jen at Four51
/* Dynamically pulls ProductImage from Small Thumbnail image on properties page
   And also pulls weight from Properties page for punchout (punching back in) cartImage
*/

four51.app.controller('SpecFormCtrl', ['$scope', '$location', '$route', '$routeParams', '$window', 'ProductDisplayService', 'Variant',
function ($scope, $location, $route, $routeParams, $window, ProductDisplayService, Variant) {
	$scope.variantErrors = [];
	var varID = $routeParams.variantInteropID == 'new' ? null :  $routeParams.variantInteropID;
	$scope.loadingImage = true;
	ProductDisplayService.getProductAndVariant($routeParams.productInteropID, varID, function(data){
		$scope.Product = data.product;
		if(varID)
			$scope.Variant = data.variant;
		else{
			$scope.Variant = {};
			$scope.Variant.ProductInteropID = $scope.Product.InteropID;
			$scope.Variant.Specs = {};
			angular.forEach($scope.Product.Specs, function(item){
				if(!item.CanSetForLineItem)
				{
					$scope.Variant.Specs[item.Name] = item;
				}
			});
		}
	});
	function validateVariant(){
		if(!$scope.Variant) return;
		var newErrors = [];
		angular.forEach($scope.Variant.Specs, function(s){
			if(s.Required && !s.Value)
				newErrors.push(s.Label || s.Name + ' is a required field');
		});
		$scope.variantErrors = newErrors;
	}
	$scope.$watch('Variant.Specs', function(o, n){
		validateVariant();
	}, true);
	function saveVariant(variant, saveNew, hideErrorAlert /*for compatibility*/) {
		if($scope.variantErrors.length){
			$scope.showVariantErrors = true;
			if(!hideErrorAlert)
				$window.alert("please fill in all required fields"); //the default spec form should be made to deal with showing $scope.variantErrors, but it's likely existing spec forms may not deal with $scope.variantErrors
			return;
		}
		if(saveNew) $scope.Variant.InteropID = null;
		Variant.save(variant, function(data){
			$location.path('/product/' + $scope.Product.InteropID + '/'+ data.InteropID);
		});
	}
	$scope.save = function(hideErrorWindowAlert){
		saveVariant($scope.Variant, false, hideErrorWindowAlert);
	}

	$scope.saveasnew = function(hideErrorAlert) {
		saveVariant($scope.Variant, true, hideErrorAlert);
	}

	$scope.$on('event:imageLoaded', function(event, result) {
		$scope.loadingImage = !result;
		$scope.$apply();
	});
	
	/* Check for the presence of the null value when there is a custom user field default value and replace it with a blank value. */
    $scope.$watch('Variant', function(val) {
        ProductDisplayService.getProductAndVariant($routeParams.productInteropID, varID, function(data){
            if (!val) return;
            angular.forEach(val.Specs, function(s){
            	//console.log("this is data: " + data);
            	//console.log(s);
            	if (s.Name == "Weight") {
            	   DynamicWeight = $scope.Product.ShipWeight;
            	   console.log(s.Value);
            		s.Value = DynamicWeight;
            		console.log(s.Value);
            	}    
            	if (s.Name == "ProductImage") {
            	   newUrlValue = $scope.Product.SmallImageUrl;
            		s.Value = newUrlValue;
            	}
                if(s.Value == "null"){
                    s.Value = "";
                }
            });
        });
    });
}]);
