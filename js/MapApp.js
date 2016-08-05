import getEl from './getEl.js';
import Place from './Place.js';
import PlaceArchive from './PlaceArchive.js';

export default class MapApp{
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
		this.$rootEl = selector ? getEl(selector) : document.body;
		this.$rootEl.insertAdjacentHTML('afterbegin',newElement);

		this.$mapEl = getEl('.map', this.$rootEl);
		this.$placeList = getEl('.place-list', this.$rootEl);
		this.newPlaceHeight = getEl('.new-place', this.$rootEl).offsetHeight;

		this.setWindowSize();
		this.mapInit();
		this.eventsInit();
	}
	checkLS(){
		if(localStorage[this.myPlaces.selector]){
			_.forEach(JSON.parse(localStorage[this.myPlaces.selector]), item => {
				let place = new Place(item.name, item.latitude, item.longitude, item.inFavorite)
				this.myPlaces.push(place)
			})
		}
	}
	mapInit(){
		let mapLoad = (lat, lan) => {
			this.map = new google.maps.Map(this.$mapEl, {
				center: new google.maps.LatLng(lat, lan),
				zoom: this.zoom,
				mapTypeId: this.mapType,
				mapTypeControlOptions: {
					position: google.maps.ControlPosition.LEFT_BOTTOM
				}
			});
		};
		let geoSuccess = position => {
			mapLoad(position.coords.latitude, position.coords.longitude);
			this.myPlaces = new PlaceArchive(this.map, this.selector, this.$rootEl, this.iconFavorite);
			this.checkLS();
		};

		let geoFailure = () => {
			// alert("Ошибка геолокации");
			mapLoad(this.center.lat, this.center.lan);
			this.myPlaces = new PlaceArchive(this.map, this.selector, this.$rootEl, this.iconFavorite);
			this.checkLS();
		};

		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(geoSuccess, geoFailure);
		}else{
			alert('Пора поменять браузер:)');
		}
	}
	eventsInit(){
		// Добавление нового места
		getEl('.add', this.$rootEl).addEventListener('click', () => {
			let name = getEl('.new-place input', this.$rootEl).value;
			if(name.length > 0){
				getEl('.new-place input', this.$rootEl).value = '';
				getEl('.helper', this.$rootEl).classList.remove('hide');
				google.maps.event.addListenerOnce(this.map, 'click', e => {
					let place = new Place(name, e.latLng.lat(), e.latLng.lng());
					this.myPlaces.push(place);
					getEl('.helper', this.$rootEl).classList.add('hide');
				});
			} else{
				alert('Введите текст заметки')
			}
		});
		// Добавление в избранное / удаление / редактирование
		this.$placeList.addEventListener('click', e => {
			let place = e.target.closest('.place');
			let num = _.indexOf(place.parentNode.children, place);

			if(e.target.matches('.favorite')){
				let $favButton = place.querySelector('.favorite');
				$favButton.classList.toggle('fa-star-o');
				$favButton.classList.toggle('fa-star');
				this.myPlaces.inFavorite(num);
			}
			if(e.target.matches('.delete')){
				place.remove();
				this.myPlaces.removePlace(num);
			}
			if(e.target.matches('.edit')){
				place.setAttribute('contenteditable', true);
				place.classList.add('edited');
			}
			if(e.target.matches('.save')){
				// if(place.innerText.length == 0){
					place.setAttribute('contenteditable', false);
					place.classList.remove('edited');
					this.myPlaces.saveEdit(num, place);
				// } else{
				// 	alert('Введите текст заметки')
				// }
			}
		});
		// Hover на списке заметок
		this.$placeList.addEventListener('mouseover', e => this.listHover(e, google.maps.Animation.BOUNCE, this.myPlaces));
		this.$placeList.addEventListener('mouseout', e => this.listHover(e, null, this.myPlaces));
		// Показ/скрытие списка
		getEl('.open-list', this.$rootEl).addEventListener('click', ()=> this.$placeList.classList.toggle('hide'));
		// Изменение размера карты
		window.addEventListener('resize', ()=> this.setWindowSize());
	}
	setWindowSize(){
		let $rootEl = this.$rootEl === document.body ? window : this.$rootEl;

		let $rootElHeight = ($rootEl === window) ? $rootEl.innerHeight : $rootEl.offsetHeight;

		this.$mapEl.style.height = $rootElHeight + 'px';
		this.$mapEl.style.width = $rootEl.innerWidth + 'px';
		this.$placeList.style.maxHeight = $rootElHeight-this.newPlaceHeight + 'px';
	}
	listHover(e, animation){
		if(e.target.matches('.place p')){
			let num = _.indexOf(e.target.closest('.place-list').children, e.target.parentNode);
			this.myPlaces[num].marker.setAnimation(animation);
		}
	}
}