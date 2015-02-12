(function(){
	'use strict';


	angular
		.module('leaflet', [])
		.constant('EVENTS', {
			openModal: 'openModal',
			modalSubmit: 'drawCircle'
		})
		.value('darkness', 0.8)
		.run(moduleRun)
		.factory('lMapServ', lMapServ)
		.service('lineServ', lineServ)
		.service('colorGeneratorServ',colorGenerator)
		//.directive('ngRightClick', ngRightClick)
		.directive('dlgCircle', dlgCircle)
		.controller('MainCtrl', MainCtrl);

	function moduleRun(){

	}

	MainCtrl.$inject = ['lMapServ', '$rootScope', 'EVENTS'];
	function MainCtrl(mapServ, scope, EVENTS){
		var vm = this;

		scope.$on(EVENTS.modalSubmit, createCircle)

		mapServ.init(
			'map',
			[51.505, -0.09],
			13, 
			'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',
			'examples.map-i875mjb7',
			contextMenuClick
			);

		function createCircle(event, data){
			mapServ.drawCircle([data.coords.lat, data.coords.lng], data.radius);
		}

		function contextMenuClick(e){
			scope.$broadcast(EVENTS.openModal, e.latlng);
		}
	}


	lMapServ.$inject = ['$window', 'colorGeneratorServ', 'lineServ', 'darkness'];
	function lMapServ(wnd, colorGener, lineServ, darkness){
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
			var color = colorGener.generate(darkness);
			lib.circle(coords, radius, {
				color: color,
				fillColor: color,
				fillOpacity: 1
			}).addTo(map);

			circles.push({coords: coords, radius: radius});

			if(circles.length > 1){
				connectLastCircles();
			}
		}

		function drawLine(coordsA, coordsB){
			L.polyline([coordsA, coordsB], {color: 'black'}).addTo(map);
		}

		function connectLastCircles(){
			var coordsA, 
				coordsB, 
				circAcoords = circles[circles.length-1].coords, 
				circBcoords = circles[circles.length-2].coords,
				rad1 = circles[circles.length-1].radius,
				rad2 = circles[circles.length-2].radius,
				dist = lineServ.getLineDistance(circAcoords, circBcoords),
				koef = dist / lineServ.coordsToMeters(circAcoords, circBcoords),
				cos = lineServ.getCos(circAcoords, circBcoords),
				sin = lineServ.getSin(circAcoords, circBcoords);

			coordsA = [	circAcoords[0] + dist * koef * cos * rad1,
						circAcoords[1] + dist * koef * sin * rad1];
			coordsB = [	circBcoords[0] - dist * koef * cos * rad2,
						circBcoords[1] - dist * koef * sin * rad2];
			console.log(circBcoords);
			drawLine(coordsA, coordsB);

		}

	}

	function lineServ(){
		this.getLineKoefs = function(coordsA, coordsB){
			var k = (coordsB[1] - coordsA[1]) / (coordsB[0] - coordsA[0]);
			var b = coordsA[1] - k * coordsA[0];
			return {k: k, b: b};//kx + b
		};

		this.getLineDistance = function(coordsA, coordsB){
			var x = coordsA[0] - coordsB[0], y = coordsA[1] - coordsB[1];
			return Math.sqrt(x * x + y * y);
		};

		this.getCos = function(coordsA, coordsB){
			var dist = this.getLineDistance.apply(this, arguments);
			return (coordsB[0] - coordsA[0]) / dist;
		};

		this.getSin = function(coordsA, coordsB){
			var dist = this.getLineDistance.apply(this, arguments);
			return (coordsB[1] - coordsA[1]) / dist;
		};

		this.coordsToMeters = function(coordsA, coordsB){  // generally used geo measurement function
			var lat1 = coordsA[0], lat2 = coordsB[0];
			var lon1 = coordsA[1], lon2 = coordsB[1];
			var R = 6378.137; // Radius of earth in KM
			var dLat = (lat2 - lat1) * Math.PI / 180;
			var dLon = (lon2 - lon1) * Math.PI / 180;
			var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
			Math.sin(dLon/2) * Math.sin(dLon/2);
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			var d = R * c;
			return d * 1000; // meters
		};
	}

	//colorGenerator.$inject = [];
	function colorGenerator(){
		function getNum(darkness){
			return parseInt(Math.random() * 255 * (1-darkness));
		}

		this.generate = function(darkness){
			var colorObj = {
				red: getNum(darkness),
				green: getNum(darkness),
				blue: getNum(darkness)
			};

			return 'rgb(' + colorObj.red + ', ' + colorObj.green + ', ' + colorObj.blue + ')';
		}
	}

	dlgCircle.$inject = ['$rootScope', 'EVENTS'];
	function dlgCircle(rootScope, EVENTS){
		return {
			restrict: 'E',
			replace: 'true',
			link: function(scope, element, attrs){
				scope.radius = 0;
				var jqElement = $(element);
				var curCoords = null;

				scope.$on(EVENTS.openModal, open);

				jqElement.dialog({
					dialogClass: "no-close",
					buttons: [
						{
							text: "OK",
							click: function() {
								ok();
							}
						}
					]
				}).dialog('close');

				function ok(){
					rootScope.$broadcast(EVENTS.modalSubmit, {radius: scope.radius, coords: curCoords});
					scope.$apply(function(){scope.radius = 0});
					jqElement.dialog('close');

				}

				function open(event, coords){
					curCoords = coords;
					jqElement.dialog('open');
				}
			},
			template: 	'<div id="dialog-circle">' +
							'<label>Enter circle radius (meters): </label>' + 
							'<input type="number" ng-model="radius"/>' + 
						'</div>'
		}
	}
})();