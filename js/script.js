/* global google */
/* global _ */
document.addEventListener("DOMContentLoaded", () => {
// Получение элемента по CSS селектору
let getEl = (selector, scope) => (scope === window) ? document.querySelector(selector) : (scope || document).querySelector(selector);

// Конструктор объекта
class Place{
	constructor(name, latitude, longitude){
		this.name = name;
		this.latitude = latitude;
		this.longitude = longitude;
		this.inFavorite = false;
	}
}

// Конструктор массива объектов
class PlaceArchive extends Array{
	constructor(map, selector, rootEl, iconFavorite){
		super();
		this.map = map;
		this.selector = (selector === undefined) ? 'myPlaces' : 'myPlaces' + selector;
		this.rootEl = rootEl;
		this.iconFavorite = iconFavorite ? iconFavorite : 'styles/imgs/marker-favorite.png';

		if(localStorage[this.selector]){
			_.forEach(JSON.parse(localStorage[this.selector]), item => this.push(item));
		}
	}
	savePlaces(){
		let savedPlaces = [];
		this.forEach(item => {
			savedPlaces.push({
				name: item.name,
				latitude: item.latitude,
				longitude: item.longitude,
				inFavorite: item.inFavorite
			});
		});
		localStorage.setItem(this.selector, JSON.stringify(savedPlaces));
	}
	push(place){
		super.push(place);
		this.renderItem(place);
		this.savePlaces();
	}
	inFavorite(num){
		this[num].inFavorite = !this[num].inFavorite;
		this[num].marker.setIcon(this[num].inFavorite ? this.iconFavorite : null);
		this.savePlaces();
	}
	removePlace(num){
		this[num].marker.setMap(null);
		this.splice(num, 1);
		this.savePlaces();
	}
	renderItem(place){
		const template = getEl('#template-place').innerHTML;
		const compiled = _.template(template);
		const newElement = compiled(place);

		place.marker = new google.maps.Marker({
			position: new google.maps.LatLng(place.latitude, place.longitude),
			map: this.map,
			title: place.name
		});

		if(place.inFavorite){
			place.marker.setIcon(this.iconFavorite);
		}
		getEl('.place-list', this.rootEl).insertAdjacentHTML('beforeEnd', newElement);
	}
}

// Конструктор приложения
class MapApp{
	constructor(config = {}){
		const template = getEl('#template-map').innerHTML;
		const compiled = _.template(template);
		const newElement = compiled();

		let mapTypeId = google.maps.MapTypeId;
		let {
			selector,
			mapType = 'ROADMAP',
			zoom = 13,
			center = {lat: 46.488056, lan: 30.741111},
			iconFavorite
		} = config;

		this.selector = selector;
		this.mapType = mapTypeId[mapType];
		this.zoom = zoom;
		this.center = center;
		this.iconFavorite = iconFavorite;
		this.rootEl = selector ? getEl(selector) : document.body;
		this.rootEl.insertAdjacentHTML('afterbegin',newElement);

		this.$mapEl = getEl('.map', this.rootEl);
		this.$placeList = getEl('.place-list', this.rootEl);
		this.newPlaceHeight = getEl('.new-place', this.rootEl).offsetHeight;

		this.setWindowSize();
		this.mapInit();
		this.eventsInit();
	}
	mapInit(){
		let mapLoad = (lat, lan) => {
			this.map = new google.maps.Map(this.$mapEl, {
				center: new google.maps.LatLng(lat, lan),
				zoom: this.zoom,
				mapTypeId: this.mapType
			});
		};
		let geoSuccess = position => {
			mapLoad(position.coords.latitude, position.coords.longitude);
			this.myPlaces = new PlaceArchive(this.map, this.selector, this.rootEl, this.iconFavorite);
		};

		let geoFailure = () => {
			alert("Ошибка геолокации");
			mapLoad(this.center.lat, this.center.lan);
			this.myPlaces = new PlaceArchive(this.map, this.selector, this.rootEl, this.iconFavorite);
		};

		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(geoSuccess, geoFailure);
		}else{
			alert('Пора поменять браузер:)');
		}
	}
	eventsInit(){
		// Добавление нового места
		getEl('.add', this.rootEl).addEventListener('click', () => {
			let name = getEl('.new-place input', this.rootEl).value;
			if(name.length > 0){
				getEl('.new-place input', this.rootEl).value = '';
				getEl('.helper', this.rootEl).classList.remove('hide');
				google.maps.event.addListenerOnce(this.map, 'click', e => {
					let place = new Place(name, e.latLng.lat(), e.latLng.lng());
					this.myPlaces.push(place);
					getEl('.helper', this.rootEl).classList.add('hide');
				});
			}
		});
		// Добавление в избранное / удаление
		this.$placeList.addEventListener('click', e => {
			let place = e.target.closest('.place');
			let num = _.indexOf(place.parentNode.children, place);

			if(e.target.matches('.favorite')){
				place.classList.toggle('in-favorite');
				this.myPlaces.inFavorite(num);
			}
			if(e.target.matches('.delete')){
				place.remove();
				this.myPlaces.removePlace(num);
			}
		});
		// Hover на списке заметок
		this.$placeList.addEventListener('mouseover', e => this.listHover(e, google.maps.Animation.BOUNCE, this.myPlaces));
		this.$placeList.addEventListener('mouseout', e => this.listHover(e, null, this.myPlaces));
		// Показ/скрытие списка
		getEl('.open-list', this.rootEl).addEventListener('click', ()=> this.$placeList.classList.toggle('hide'));
		// Изменение размера карты
		window.addEventListener('resize', ()=> this.setWindowSize());
	}
	setWindowSize(){
		let rootEl = this.rootEl === document.body ? window : this.rootEl;

		let rootElHeight = (rootEl === window) ? rootEl.innerHeight : rootEl.offsetHeight;

		this.$mapEl.style.height = rootElHeight + 'px';
		this.$mapEl.style.width = rootEl.innerWidth + 'px';
		this.$placeList.style.maxHeight = rootElHeight-this.newPlaceHeight + 'px';
	}
	listHover(e, animation){
		if(e.target.matches('.place')){
			let num = _.indexOf(e.target.parentNode.children, e.target);
			this.myPlaces[num].marker.setAnimation(animation);
		}
	}
}

new MapApp/*({
	selector: '',
	mapType: 'HYBRID', //ROADMAP , SATELLITE, HYBRID, TERRAIN
	zoom: 9, // 0-18
	center: {
		lat: 48.8534100,
		lan: 2.3488000
	},
	iconFavorite: 'imgs/custom-marker.png'
})*/;
});