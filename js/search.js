var latDep;
var longDep;
var latArr;
var longArr;

window.addEventListener("load", function() {
    const searchWrapper = document.querySelector(".search-input");
    const inputBox = searchWrapper.querySelector("input");
    const suggBox = searchWrapper.querySelector(".autocom-box");
    inputBox.value = '';
    document.getElementById("searchbox-source-dest").setAttribute("disabled",'true');
    document.getElementById("flexSwitchCheckChecked").checked = true;
    document.getElementById("selectCar").value = 290;

    inputBox.onkeyup = (e) => {
        let userData = e.target.value; //user enetered data
        let emptyArray = [];
        let emptyArray2 = [];
        if (userData) {
            //On charge les données depuis l'API
            this.fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${userData}.json?country=fr&types=place%2Cpostcode%2Caddress&access_token=pk.eyJ1IjoiYW50b2luZXBpcmV0IiwiYSI6ImNrem1xM3NrYTJxbDIycG5yOXl0ZTNvdmQifQ.Yn42p_gFJ2Tcpkodv_ANxw`)
                .then(response => response.json())
                .then(data => {
                    for (const sugg of data.features) {
                        emptyArray.push(sugg);
                        emptyArray2.push(sugg.place_name);
                    }
                    emptyArray2 = emptyArray2.map((data) => {
                        // passing return data inside li tag
                        return data = `<li>${data}</li>`;
                    });
                    searchWrapper.classList.add("active"); //show autocomplete box
                    showSuggestions(emptyArray2);
                    let allList = suggBox.querySelectorAll("li");
                    for (let i = 0; i < allList.length; i++) {
                        //adding onclick attribute in all li tag
                        allList[i].addEventListener("click", function() {
                            select(allList[i], emptyArray[i].geometry.coordinates[0], emptyArray[i].geometry.coordinates[1])
                        }, { once: true });
                    }
                });


        } else {
            searchWrapper.classList.remove("active"); //hide autocomplete box
        }
    }

    function select(element, long, lat) {
        let selectData = element.textContent;
        inputBox.value = selectData;
        searchWrapper.classList.remove("active");
        map.setView([lat, long], 13);
        var marker = L.marker([lat, long]).addTo(map);
        markersItin.push(marker);
        marker._icon.classList.add("huechangegreen");
        latDep = lat;
        longDep = long;
        document.getElementById("searchbox-source-dest").removeAttribute("disabled");
    }

    function showSuggestions(list) {
        let listData;
        if (!list.length) {
            userValue = inputBox.value;
            listData = `<li>${userValue}</li>`;
        } else {
            listData = list.join('');
        }
        suggBox.innerHTML = listData;
    }
});


///////////////////// barre de recherche des destinations, on duplique tout ////////////////////////



window.addEventListener("load", function() {
    const searchWrapper = document.querySelector(".search-input-dest");
    const inputBox = searchWrapper.querySelector("input");
    const suggBox = searchWrapper.querySelector(".autocom-box-dest");
    inputBox.value = '';

    inputBox.onkeyup = (e) => {
        let userData = e.target.value; //user enetered data
        let emptyArray = [];
        let emptyArray2 = [];
        if (userData) {
            //On charge les données depuis l'API
            this.fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${userData}.json?country=fr&types=place%2Cpostcode%2Caddress&access_token=pk.eyJ1IjoiYW50b2luZXBpcmV0IiwiYSI6ImNrem1xM3NrYTJxbDIycG5yOXl0ZTNvdmQifQ.Yn42p_gFJ2Tcpkodv_ANxw`)
                .then(response => response.json())
                .then(data => {
                    for (const sugg of data.features) {
                        emptyArray.push(sugg);
                        emptyArray2.push(sugg.place_name);
                    }
                    emptyArray2 = emptyArray2.map((data) => {
                        // passing return data inside li tag
                        return data = `<li>${data}</li>`;
                    });
                    searchWrapper.classList.add("active"); //show autocomplete box
                    showSuggestions(emptyArray2);
                    let allList = suggBox.querySelectorAll("li");
                    for (let i = 0; i < allList.length; i++) {
                        //adding onclick attribute in all li tag
                        allList[i].addEventListener("click", function() {
                            select(allList[i], emptyArray[i].geometry.coordinates[0], emptyArray[i].geometry.coordinates[1])
                        }, { once: true });
                    }
                });


        } else {
            searchWrapper.classList.remove("active"); //hide autocomplete box
        }
    }

    function select(element, long, lat) {
        let selectData = element.textContent;
        inputBox.value = selectData;
        searchWrapper.classList.remove("active");
        map.setView([lat, long], 13);
        latArr = lat;
        longArr = long;
        var marker = L.marker([lat, long]).addTo(map);
        markersItin.push(marker);
        marker._icon.classList.add("huechangegreen");
    }

    function showSuggestions(list) {
        let listData;
        if (!list.length) {
            userValue = inputBox.value;
            listData = `<li>${userValue}</li>`;
        } else {
            listData = list.join('');
        }
        suggBox.innerHTML = listData;
    }
});