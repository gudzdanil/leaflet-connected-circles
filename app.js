(function(){
	'use strict';


	angular
		.module('leaflet', [])
		.run(moduleRun)
		.factory('lMapServ', lMapServ)
		.service('colorGeneratorServ',colorGenerator)
		//.directive('ngRightClick', ngRightClick)
		.directive('dlgCircle', dlgCircle)
		.controller('mainCtrl', mainCtrl);

	function moduleRun(){

	}

	mainCtrl.$inject = ['lMapServ'];
	function mainCtrl(mapServ){
		var vm = this;

		vm.dialog = {
			okCallback: createCircle,
			cancelCallback: function(){},
			opened: false
		};

		mapServ.init(
			'map',
			[51.505, -0.09],
			13, 
			'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',
			'examples.map-i875mjb7',
			contextMenuClick
			);

		function createCircle(){
			console.log('controller ok');
		}

		function contextMenuClick(e){
			vm.dialog.opened = true;
		}
	}


	lMapServ.$inject = ['$window', 'colorGeneratorServ'];
	function lMapServ(wnd, colorGener){
		var lib = wnd.L;
		var map;
		var circles = [];

		return {
			init: init,
			drawCircle: drawCircle
		};

		function init(elemId, coords, zoom, mapUrl, mapId, callBack){
			map = lib.map(elemId).setView(coords, zoom);
			lib.tileLayer(mapUrl, {
				attribution: 'Test task by Gudz Danil',
				id: mapId
			}).addTo(map);
			map.on('contextmenu', callBack);
		}
		function drawCircle(coords, radius){
			var color = colorGener.generate();
			lib.circle(coords, radius, {
				color: color,
				fillColor: color,
				fillOpacity: 0.5
			}).addTo(map);
		}
	}


	//colorGenerator.$inject = [];
	function colorGenerator(){
		function getNum(){
			return parseInt(Math.random() * 255);
		}

		this.generate = function(){
			var colorObj = {
				red: getNum(),
				green: getNum(),
				blue: getNum()
			};

			return 'rgb(' + colorObj.red + ', ' + colorObj.green + ', ' + colorObj.blue + ')';
		}
	}

	function dlgCircle(){
		return {
			restrict: 'E',
			replace: 'true',
			/*controller: dlgCircleCtrl,
			controllerAs: 'modal',*/
			scope: {
				opened: '=',
				ok: '=',
				cancel: '='
			},
			link: linkDlg,
			template: 	'<div id="dialog-circle">' +
							'<label>Enter circle radius (meters): </label>' + 
							'<input type="number" ng-model="vm.radius"/>' + 
						'</div>'
		}
	}

	function linkDlg(scope, element, attrs){
		scope.radius = 0;

		$(element).dialog({
			dialogClass: "no-close",
			buttons: [
				{
					text: "OK",
					click: function() {
						ok();
					}
				}
			]
		});

		scope.$apply();

		function close(){
			$(element).dialog('close');
			console.log('close');
		}

		function ok(){
			$(element).dialog('close');
			console.log('ok, radius: ' + scope.radius);
		}

		function open(){
			$(element).show('open');
			console.log('open');
		}

		scope.$watch(attrs.opened, function(){
			if(attrs.opened){
				open();
			}
			else{
				close();
			}
		});

		//setInterval(function(){console.log(scope.opened); }, 2000);
		
	}

	function dlgCircleCtrl(){
	
	}



	/*
	ngRightClick.$inject = ['$parse'];
	function ngRightClick($parse) {
		return function(scope, element, attrs) {
			var fn = $parse(attrs.ngRightClick);
			element.bind('contextmenu', function(event) {
				console.log(event);
				scope.$apply(function() {
					event.preventDefault();
					fn.call(scope, {$event:event});
				});
			});
		};
	}
*/

})();