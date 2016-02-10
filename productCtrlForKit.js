four51.app.controller('ProductCtrl', ['$scope', '$routeParams', '$route', '$location', '$451', 'Product', 'ProductDisplayService', 'Order', 'Variant', 'User',
function ($scope, $routeParams, $route, $location, $451, Product, ProductDisplayService, Order, Variant, User) {
    $scope.selected = 1;
    $scope.LineItem = {};
	$scope.addToOrderText = "Add To Cart";
	$scope.loadingIndicator = true;
	$scope.loadingImage = true;
	$scope.searchTerm = null;
	$scope.settings = {
		currentPage: 1,
		pageSize: 10
	};
	
	//Start Kit
	
	
	//you will need to match these up to API ID
    var maternityKitIndex = ['/40713/product/40713-MaternityKitItem1', '/40713/product/40713-MaternityKitItem2', '/40713/product/40713-MaternityKitItem3', '/40713/product/40713-MaternityKitItem4', '/40713/product/40713KitLastItem'];
	var dentistKitIndex = ['/40713/product/40713DentistKitItem1', '/40713/product/40713DentistKitItem2', '/40713/product/40713DentistKitItem3', '/40713/product/40713DentistKitItem4', '/40713/product/40713DentistKitItem5', '/40713/product/40713DentistKitItem6', '/40713/product/40713KitLastItem'];
	var staffKitIndex = ['/40713/product/40713StaffKitItem1', '/40713/product/40713StaffKitItem2', '/40713/product/40713StaffKitItem3', '/40713/product/40713StaffKitItem4', '/40713/product/40713KitLastItem'];
    
	//watch for location
    var pathname = window.location.pathname;
	var pathnameLength = pathname.split('/');

	//handles variable item paths
	if (pathnameLength.length >= 5) {
		pathnameLength.pop();
		var pathname = pathnameLength.toString();
		while (pathname.indexOf(',') != -1) {
			var pathname = pathname.replace(',', '/');
		};
	}

	//check for index, increment and decrement paths for Maternity Kit 
	if (maternityKitIndex.indexOf(pathname) != -1) {
		var prevKitItemIndex = maternityKitIndex.indexOf(pathname);
		if (prevKitItemIndex > 0) { 
			prevKitItemIndex--;
			
			var prevPath = maternityKitIndex[prevKitItemIndex];
			var prevPath = prevPath.replace('/40713/', '');
			$scope.prevItem = prevPath;
			
		} 
		if (prevKitItemIndex == 0) {
			var prevPath = '/40713/catalog';
			$scope.prevItem = prevPath;
			console.log(prevPath);
		}
		
		var nextKitItemIndex = maternityKitIndex.indexOf(pathname);
		if (nextKitItemIndex < maternityKitIndex.length-1) { 
			var currentKitItemIndex = nextKitItemIndex;
			nextKitItemIndex ++;
			var newPath = maternityKitIndex[nextKitItemIndex];
			var newPath = newPath.replace('/40713/', '');
			$scope.nextItem = newPath;
		} //sets path for next arrow on last item in index
		else {
			var newPath = '/40713/cart';
			$scope.nextItem = newPath;
		}
	}
	

	
    //end Kit
	
	$scope.calcVariantLineItems = function(i){
		$scope.variantLineItemsOrderTotal = 0;
		angular.forEach($scope.variantLineItems, function(item){
			$scope.variantLineItemsOrderTotal += item.LineTotal || 0;
		})
	};
	function setDefaultQty(lineitem) {
		if (lineitem.PriceSchedule && lineitem.PriceSchedule.DefaultQuantity != 0)
			$scope.LineItem.Quantity = lineitem.PriceSchedule.DefaultQuantity;
	}
	function init(searchTerm, callback) {
		ProductDisplayService.getProductAndVariant($routeParams.productInteropID, $routeParams.variantInteropID, function (data) {
			$scope.LineItem.Product = data.product;
			$scope.LineItem.Variant = data.variant;
			ProductDisplayService.setNewLineItemScope($scope);
			ProductDisplayService.setProductViewScope($scope);
			setDefaultQty($scope.LineItem);
			$scope.$broadcast('ProductGetComplete');
			$scope.loadingIndicator = false;
			$scope.setAddToOrderErrors();
			data.product.Specs.ProductImage.DefaultValue = data.product.SmallImageUrl;
			data.product.Specs.Weight.DefaultValue = data.product.ShipWeight;
			var checkForThis = $scope.LineItem.Specs.ProductImage;	
			
			$scope.$watch('LineItem.Specs', function (spec) {
    		//sets Product Image Path to pre-existing four51 path
    		if (spec && (spec.Name  = 'ProductImage') && ($scope.LineItem.Product.Type != 'VariableText')) {
    			if (!$scope.LineItem.Product.IsVBOSS) {	 
    				if ($scope.LineItem.Specs && $scope.LineItem.Specs.ProductImage) {
    					$scope.LineItem.Specs.ProductImage.Value = data.product.SmallImageUrl;
    				}
    			}
    		}
    		//sets Weight spec to be equal to weight on properties page
    		if (spec && (spec.Name  = 'Weight') && ($scope.LineItem.Product.Type != 'VariableText')) {
    			if (!$scope.LineItem.Product.IsVBOSS) {     
    				if ($scope.LineItem.Specs && $scope.LineItem.Specs.Weight) {
    					$scope.LineItem.Specs.Weight.Value = data.product.ShipWeight;
    				}
    			}
    		} 
    });
			
			if (angular.isFunction(callback))
				callback();
		}, $scope.settings.currentPage, $scope.settings.pageSize, searchTerm);
	}
	
	//
	console.log('going to send it like Mirra');
	
	$scope.$watch('settings.currentPage', function(n, o) {
		if (n != o || (n == 1 && o == 1))
			init($scope.searchTerm);
	});

	$scope.searchVariants = function(searchTerm) {
		$scope.searchTerm = searchTerm;
		$scope.settings.currentPage == 1 ?
			init(searchTerm) :
			$scope.settings.currentPage = 1;
	};

	$scope.deleteVariant = function(v, redirect) {
		if (!v.IsMpowerVariant) return;
		// doing this because at times the variant is a large amount of data and not necessary to send all that.
		var d = {
			"ProductInteropID": $scope.LineItem.Product.InteropID,
			"InteropID": v.InteropID
		};
		Variant.delete(d,
			function() {
				redirect ? $location.path('/product/' + $scope.LineItem.Product.InteropID) : $route.reload();
			},
			function(ex) {
				$scope.lineItemErrors.push(ex.Message);
				$scope.showAddToCartErrors = true;
			}
		);
	}

	$scope.addToOrder = function(){
		if($scope.lineItemErrors && $scope.lineItemErrors.length){
			$scope.showAddToCartErrors = true;
			return;
		}
		if(!$scope.currentOrder){
			$scope.currentOrder = { };
			$scope.currentOrder.LineItems = [];
		}
		if (!$scope.currentOrder.LineItems)
			$scope.currentOrder.LineItems = [];
		if($scope.allowAddFromVariantList){
			angular.forEach($scope.variantLineItems, function(item){
				if(item.Quantity > 0){
					$scope.currentOrder.LineItems.push(item);
					$scope.currentOrder.Type = item.PriceSchedule.OrderType;
				}
			});
		}else{
			$scope.currentOrder.LineItems.push($scope.LineItem);
			$scope.currentOrder.Type = $scope.LineItem.PriceSchedule.OrderType;
		}
		$scope.addToOrderIndicator = true;
		//$scope.currentOrder.Type = (!$scope.LineItem.Product.IsVariantLevelInventory && $scope.variantLineItems) ? $scope.variantLineItems[$scope.LineItem.Product.Variants[0].InteropID].PriceSchedule.OrderType : $scope.LineItem.PriceSchedule.OrderType;
		// shipper rates are not recalcuated when a line item is added. clearing out the shipper to force new selection, like 1.0
		Order.clearshipping($scope.currentOrder).
			save($scope.currentOrder,
				function(o){
					$scope.user.CurrentOrderID = o.ID;
					User.save($scope.user, function(){
						$scope.addToOrderIndicator = true;
							//sets path based on condition for KitItemIndex, Staff, dentist or all others
						    if (currentKitItemIndex < maternityKitIndex.length-1) {
								console.log(newPath);
								$location.path(newPath);
							} if (kitItemIndex < dentistKitIndex.length-1) {
								$location.path(newPath);
							} if (kitItemIndex < staffKitIndex.length-1) {
								$location.path(newPath);
							} else {
							    console.log('CartPath');
                                $location.path('/cart');   
                            }
							
					});
				},
				function(ex) {
					$scope.addToOrderIndicator = false;
					$scope.lineItemErrors.push(ex.Detail);
					$scope.showAddToCartErrors = true;
					//$route.reload();
				}
		);
	};

	$scope.setOrderType = function(type) {
		$scope.loadingIndicator = true;
		$scope.currentOrder = { 'Type': type };
		init(null, function() {
			$scope.loadingIndicator = false;
		});
	};

	$scope.$on('event:imageLoaded', function(event, result) {
		$scope.loadingImage = false;
		$scope.$apply();
	});
}]);
