export default class Place{
	constructor(name, latitude, longitude, fav = false){
		this.name = name;
		this.latitude = latitude;
		this.longitude = longitude;
		this.inFavorite = fav;
	}
}