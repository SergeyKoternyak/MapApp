import getEl from './getEl.js';

class ArrayProx {};
ArrayProx.prototype = Array.prototype;

export default class PlaceArchive extends ArrayProx{
	constructor(map, selector, $rootEl, iconFavorite){
		super();
		this.map = map;
		this.selector = (selector === undefined) ? 'myPlaces' : 'myPlaces' + selector;
		this.$rootEl = $rootEl;
		this.iconFavorite = iconFavorite ? iconFavorite : 'styles/imgs/marker-favorite.png';
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
		getEl('.place-list', this.$rootEl).insertAdjacentHTML('beforeEnd', newElement);
	}
	saveEdit(num, place){
		this[num].name = place.textContent;
		this.savePlaces();
	}
}