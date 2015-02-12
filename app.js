(function(){
	'use strict';


	Number.prototype.toBrng = function() { 
		return (this.toDeg() + 360) % 360;
	}
	Number.prototype.toRad = function(){
		return this * Math.PI / 180;
	}

	Number.prototype.toDeg = function(){
		return this * 180 / Math.PI;
	}

	angular
		.module('leaflet', [])
		.constant('EVENTS', {
			openModal: 'openModal',
			modalSubmit: 'drawCircle'
		})
		.value('darkness', 0.4)
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
				fillOpacity: 0.6
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
				circAcoords = circles[circles.length-2].coords, 
				circBcoords = circles[circles.length-1].coords,
				rad1 = circles[circles.length-2].radius,
				rad2 = circles[circles.length-1].radius;

			var bearing = lineServ.getBearing(circAcoords, circBcoords); 

			coordsA = lineServ.destBearing(circAcoords, bearing, rad1);
			coordsB = lineServ.destBearing(circBcoords, bearing, -rad2);

			drawLine(coordsA, coordsB);

			printArrow(coordsB, bearing, rad2 / 2);

		}

		function printArrow(endPoint, bearing, length){
			var leftAngle = (bearing + 180 + 20),
				rightAngle = (bearing + 180 - 20);
			console.log(bearing);
			console.log('l '+leftAngle);
			console.log('r '+rightAngle);
			drawLine(endPoint,lineServ.destBearing(endPoint, leftAngle, length));
			drawLine(endPoint,lineServ.destBearing(endPoint, rightAngle, length));
		}

	}

	function lineServ(){
		var R = 6378.137;

		this.getLineKoefs = getLineKoefs;
		this.getLineDistance = getLineDistance;
		this.getCos = getCos;
		this.getSin = getSin;
		this.coordsToMeters = coordsToMeters;
		this.getBearing = getBearing;
		this.destBearing = destBearing;

		function getLineKoefs (coordsA, coordsB){
			var k = (coordsB[1] - coordsA[1]) / (coordsB[0] - coordsA[0]);
			var b = coordsA[1] - k * coordsA[0];
			return {k: k, b: b};//kx + b
		};

		function getLineDistance(coordsA, coordsB){
			var x = coordsA[0] - coordsB[0], y = coordsA[1] - coordsB[1];
			return Math.sqrt(x * x + y * y);
		};

		function getCos(coordsA, coordsB){
			var dist = this.getLineDistance.apply(this, arguments);
			return (coordsB[0] - coordsA[0]) / dist;
		};

		function getSin(coordsA, coordsB){
			var dist = this.getLineDistance.apply(this, arguments);
			return (coordsB[1] - coordsA[1]) / dist;
		};

		function coordsToMeters(coordsA, coordsB){  // generally used geo measurement function
			var lat1 = coordsA[0], lat2 = coordsB[0];
			var lon1 = coordsA[1], lon2 = coordsB[1];
			
			var dLat = (lat2 - lat1).toRad();
			var dLon = (lon2 - lon1).toRad();

			var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
					Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
					Math.sin(dLon/2) * Math.sin(dLon/2);

			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			var d = R * c;
			return d * 1000; 
		};

		function getBearing(coordsA, coordsB){
			var lat1 = coordsA[0], lat2 = coordsB[0], lon1 = coordsA[1], lon2 = coordsB[1];
			lat1 = lat1.toRad(); lat2 = lat2.toRad();
			var dLon = (lon2-lon1).toRad();
			var y = Math.sin(dLon) * Math.cos(lat2);
			var x = Math.cos(lat1)*Math.sin(lat2) -
					Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);

			return Math.atan2(y, x).toBrng();
		}

		function destBearing(coords, bearing, dist){
			
			var angDist = dist / 1000 / R;
			bearing = bearing.toRad();

			var lat = coords[0].toRad();
			var lon = coords[1].toRad();

			var latFinal = Math.asin(Math.sin(lat)*Math.cos(angDist) +
	                    			Math.cos(lat)*Math.sin(angDist)*Math.cos(bearing) );

			var lonFinal = lon + Math.atan2(Math.sin(bearing)*Math.sin(angDist)*Math.cos(lat),
	                        Math.cos(angDist)-Math.sin(lat)*Math.sin(latFinal));

			lonFinal = (lonFinal+3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180°

			return [latFinal.toDeg(), lonFinal.toDeg()];
		}
		
	}

	//colorGenerator.$inject = [];
	function colorGenerator(){
		this.generate = generate;

		function getNum(darkness){
			return parseInt(Math.random() * 255 * (1-darkness));
		}

		function generate(darkness){
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