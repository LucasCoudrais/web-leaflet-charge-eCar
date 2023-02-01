var map = L.map('map').setView([48, 2.5], 6);
const submitItin = document.getElementById("submit-itineraire");
const displayBornes = document.getElementById("flexSwitchCheckChecked");
const car = document.getElementById("selectCar");
const instructions = document.getElementById('instructions');
var bornes = [];
var bornesPower = [];
var borneStepRecharge = [];
var markersItin = [];
var polylines = [];
var autonomieDistance;
var capacite_batterie;
var p_max;
var temps_total = 0;

var puissance_soc = {
    0: 98,
    5: 98,
    10: 95,
    15: 92,
    20: 88,
    25: 85,
    30: 83,
    35: 81,
    40: 75
}

var stepIcon = L.icon({
    iconUrl: '../step.png',

    iconSize: [20, 20], // size of the icon
    iconAnchor: [10, 10], // point of the icon which will correspond to marker's location
    popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
});

var stamenToner = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibHVjYXMtY291ZHJhaXMiLCJhIjoiY2t6aDJwMHN5Mzg5cTJvbjltN20yY3kxcyJ9.vKAismz64kY7Ju3loYcZWg'
});

map.addLayer(stamenToner);

var markersCluster = new L.MarkerClusterGroup();

var contentPopup = '';
fetch("./../bornesChargement.json") // https://api.openchargemap.io/v3/poi/?output=json&countrycode=FR&maxresults=500&key=f320a777-1eea-4fd5-b3bb-d1a2bdcae934
    .then(function (res) {
        if (res.ok) {
            return res.json();
        }
    })
    .then(function (value) {
        var json = value;
        for (let i = 0; i <= json.length; i++) {
            bornes.push(turf.point([json[i].AddressInfo.Latitude, json[i].AddressInfo.Longitude]));

            var marker = L.marker([json[i].AddressInfo.Latitude, json[i].AddressInfo.Longitude]);
            contentPopup += "<b>" + json[i].AddressInfo.Title + "</b><br>" + json[i].AddressInfo.AddressLine1;
            if (json[i].Connections[0].PowerKW != null) {
                contentPopup += "<br> Puissance : " + json[i].Connections[0].PowerKW + " kW";
            }
            if (json[i].UsageCost != null && json[i].UsageCost != "") {
                contentPopup += "<br> Prix : " + json[i].UsageCost;
            }
            contentPopup += "<br> Nombre de prises : " + json[i].Connections.length + "</br>"
            for (j = 0; j < json[i].Connections.length; j++) {

                if (json[i].Connections[j].ConnectionTypeID == 25 || json[i].Connections[0].ConnectionTypeID == 1036) {
                    contentPopup += "Type 2 ";
                }
                if (json[i].Connections[j].ConnectionTypeID == 27) {
                    contentPopup += "Supercharger ";
                }
            }
            marker.bindPopup(contentPopup);
            contentPopup = "";
            markersCluster.addLayer(marker);
        }
    })
    .catch(function (err) {
        // Une erreur est survenue
    });

map.addLayer(markersCluster);


// https://api.openchargemap.io/v3/poi/?output=json&countrycode=FR&maxresults=1000&key=f320a777-1eea-4fd5-b3bb-d1a2bdcae934
// pour ne pas utiliser un fichier direct
//Itinéraire

/*
Version plugging Leaflet
L.Routing.control({
    waypoints: [
        L.latLng(45.783943, 4.869919),
        L.latLng(45.758695526709225, 4.8706193384643495)
    ],
    routeWhileDragging: true,
}).addTo(map);
*/

//Version Mapbox
submitItin.addEventListener('click', event => {
    temps_total = 0;
    calculItineraire(latDep, longDep, latArr, longArr);
    for (i = 0; i < polylines.length; i++) {
        map.removeLayer(polylines[i]);
    }
    polylines = [];
    for (i = 0; i < markersItin.length; i++) {
        map.removeLayer(markersItin[i]);
    }
    markersItin = [];
});

//Version Mapbox
displayBornes.addEventListener('change', event => {
    if (displayBornes.checked) {
        map.addLayer(markersCluster);
    } else {
        map.removeLayer(markersCluster);
    }

});

function calculItineraire(latDep, longDep, latArr, longArr, arraySteps = []) {
    autonomieDistance = car.value;
    if (car.value == 290) {
        capacite_batterie = 41;
        p_max = 22;
    } else {
        capacite_batterie = 57;
        p_max = 170;
    }
    let latlngs = [];
    var autonomie = 0;
    var passageRecharge = false;
    var precedentStep;
    var stepsAPI = longDep + '%2C' + latDep + '%3B';
    var distance = 0;

    if (arraySteps != []) {
        for (let i = 0; i < arraySteps.length; i = i + 2) {
            stepsAPI = stepsAPI + arraySteps[i] + '%2C' + arraySteps[i + 1] + '%3B'
        }
    }
    stepsAPI = stepsAPI + longArr + '%2C' + latArr;
    fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${stepsAPI}?alternatives=true&geometries=geojson&language=fr&overview=simplified&steps=true&access_token=pk.eyJ1IjoiYW50b2luZXBpcmV0IiwiYSI6ImNrem1xM3NrYTJxbDIycG5yOXl0ZTNvdmQifQ.Yn42p_gFJ2Tcpkodv_ANxw`)
        .then(response => response.json())
        .then(
            data => {
                var legsLength = Object.keys(data.routes[0].legs).length;
                let tripIstructions = '';
                loop1:
                for (const step of data.routes[0].legs[legsLength - 1].steps) {

                    for (const coords of step.geometry.coordinates) {
                        latlngs.push([coords[1], coords[0]]);
                    }
                    tripIstructions += `<li> ${step.maneuver.instruction} </li>`;
                    let marker = L.marker([step.maneuver.location[1], step.maneuver.location[0]], { icon: stepIcon });
                    markersItin.push(marker);
                    autonomie = (autonomieDistance - (distance / 1000)) / autonomieDistance * 100;
                    if (distance > (autonomieDistance * 0.80) * 1000 && passageRecharge == false) {
                        passageRecharge = true;

                        var precedentStepChild = precedentStep.maneuver;
                        var distanceChild = distance - precedentStep.distance;
                        var passageRechargeChild = false;

                        for (const stepChild of precedentStep.intersections) {

                            distanceChild = distanceChild + (turf.distance([precedentStepChild.location[1], precedentStepChild.location[0]],
                                [stepChild.location[1], stepChild.location[0]], 'kilometers') * 1000);

                            autonomie = (autonomieDistance - (distanceChild / 1000)) / autonomieDistance * 100;

                            if (distanceChild > (autonomieDistance * 0.80) * 1000 && passageRechargeChild == false) {
                                let markerChild = L.marker([precedentStepChild.location[1], precedentStepChild.location[0]]);
                                markerChild.bindPopup(`Etape de l'itinéraire à partir de laquelle on recherche la borne de recharge la plus proche.`);
                                markerChild.on('mouseover', function (e) {
                                    this.openPopup();
                                });
                                markerChild.on('mouseout', function (e) {
                                    this.closePopup();
                                });
                                markerChild.addTo(map);
                                markersItin.push(markerChild);
                                markerChild._icon.classList.add("huechangepurple");

                                var targetPointChild = turf.point([precedentStepChild.location[1], precedentStepChild.location[0]])
                                var nearest = turf.nearestPoint(targetPointChild, turf.featureCollection(bornes));
                                let markerRecharge = L.marker(turf.getCoord(nearest));

                                let temps = 0;
                                let soc_palier;
                                let puissance_borne = 22;
                                for (let i = 0; i <= 40; i = i + 5) {
                                    if(puissance_borne < i+5) {
                                        soc_palier = puissance_soc[i];
                                        break;
                                    } else {
                                        soc_palier = 75;
                                    }
                                }
                                //1er palier
                                if (autonomie < soc_palier) {
                                    temps += 60 * ((soc_palier - autonomie) / 100) * capacite_batterie / p_max;
                                } else {
                                    temps += 0;
                                }

                                //2eme palier
                                if (autonomie < soc_palier) {
                                    temps += 60 * ((((soc_palier + 100) / 2) - soc_palier) / 100) * capacite_batterie / (0.75 * p_max);
                                } else if (autonomie < (soc_palier + 100) / 2) {
                                    temps += 60 * ((((soc_palier + 100) / 2) - autonomie) / 100) * capacite_batterie / (0.75 * p_max);
                                } else {
                                    temps += 0;
                                }

                                //3eme palier
                                if (autonomie < (soc_palier + 100) / 2) {
                                    temps += 60 * ((((soc_palier + 500) / 6) - ((soc_palier + 100) / 2)) / 100) * capacite_batterie / (0, 5 * p_max);
                                } else if (autonomie < (soc_palier + 500) / 6) {
                                    temps += 60 * ((((soc_palier + 500) / 6) - autonomie) / 100) * capacite_batterie / (0.5 * p_max);
                                } else {
                                    temps += 0
                                }

                                //4eme palier
                                if (autonomie < (soc_palier + 500) / 6) {
                                    temps += 60 * ((100 - ((soc_palier + 500) / 6)) / 100) * capacite_batterie / (0.25 * p_max);
                                } else if (autonomie < 100) {
                                    temps += 60 * ((100 - soc_palier) / 100) * capacite_batterie / (0.25 * p_max);
                                } else {
                                    temps += 0
                                }
                                temps_total+=temps;

                                markerRecharge.bindPopup(`Arrêt à la borne de recharge pendant ${Math.floor(temps)} minutes`);
                                markerRecharge.on('mouseover', function (e) {
                                    this.openPopup();
                                });
                                markerRecharge.on('mouseout', function (e) {
                                    this.closePopup();
                                });
                                markerRecharge.addTo(map);
                                markersItin.push(markerRecharge);

                                arraySteps.push(turf.getCoord(nearest)[1]);
                                arraySteps.push(turf.getCoord(nearest)[0]);
                                markerRecharge._icon.classList.add("huechangered");

                                passageRechargeChild = true;
                                calculItineraire(latDep, longDep, latArr, longArr, arraySteps);
                                break loop1;
                            }

                            precedentStepChild = stepChild;
                        }

                    }
                    marker.bindPopup(`Autonomie = ${autonomie}%`);
                    marker.on('mouseover', function (e) {
                        this.openPopup();
                    });
                    marker.on('mouseout', function (e) {
                        this.closePopup();
                    });
                    marker.addTo(map);

                    distance += step.distance;
                    precedentStep = step;


                }
                instructions.innerHTML = `<p>
                <strong> Trip duration : ${Math.floor((data.routes[0].duration / 60) + temps_total)} min dont ${Math.floor(temps_total)} de recharge</strong>
                 </p> 
                 <ol> ${tripIstructions} </ol>`;
                // if(distanceGen <= 245000){
                var polyline = L.polyline(latlngs, { color: 'green', weight: 8, opacity: 0.5 }).addTo(map);
                polylines.push(polyline);
                // zoom the map to the polyline
                map.fitBounds(polyline.getBounds());
                // }
                document.querySelector("#instructions").setAttribute("style", 'visibility:visible');

            }
        )
}