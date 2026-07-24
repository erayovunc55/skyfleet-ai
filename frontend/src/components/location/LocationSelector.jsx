import { useEffect, useState } from "react";

import {
    getCountries,
    getCities,
    getLocations,
    getLocationPoints,
} from "../../services/locationService";

export default function LocationSelector({

    title,

    value,

    onChange,

    pickup=false,

    dropoff=false,

}){

    const [countries,setCountries]=useState([]);
    const [cities,setCities]=useState([]);
    const [locations,setLocations]=useState([]);
    const [points,setPoints]=useState([]);

    const [countryId,setCountryId]=useState("");
    const [cityId,setCityId]=useState("");
    const [locationId,setLocationId]=useState("");
    const [pointId,setPointId]=useState("");

    useEffect(()=>{

        getCountries()
            .then(setCountries);

    },[]);

    useEffect(()=>{

        if(!countryId){

            setCities([]);
            return;

        }

        getCities(countryId)
            .then(setCities);

    },[countryId]);

    useEffect(()=>{

        if(!cityId){

            setLocations([]);
            return;

        }

        getLocations(cityId,{

            pickupOnly:pickup,

            dropoffOnly:dropoff

        }).then(setLocations);

    },[cityId]);

    useEffect(()=>{

        if(!locationId){

            setPoints([]);
            return;

        }

        getLocationPoints(locationId,{

            pickupOnly:pickup,

            dropoffOnly:dropoff

        }).then(setPoints);

    },[locationId]);

    useEffect(()=>{

        onChange({

            countryId,

            cityId,

            locationId,

            pointId

        });

    },[
        countryId,
        cityId,
        locationId,
        pointId
    ]);

    return(

        <div className="card">

            <h5>{title}</h5>

            <select
                value={countryId}
                onChange={(e)=>setCountryId(e.target.value)}
            >

                <option value="">
                    Country
                </option>

                {countries.map(country=>(

                    <option
                        key={country.id}
                        value={country.id}
                    >

                        {country.name}

                    </option>

                ))}

            </select>

            <select
                value={cityId}
                onChange={(e)=>setCityId(e.target.value)}
            >

                <option value="">
                    City
                </option>

                {cities.map(city=>(

                    <option
                        key={city.id}
                        value={city.id}
                    >

                        {city.name}

                    </option>

                ))}

            </select>

            <select
                value={locationId}
                onChange={(e)=>setLocationId(e.target.value)}
            >

                <option value="">
                    Location
                </option>

                {locations.map(location=>(

                    <option
                        key={location.id}
                        value={location.id}
                    >

                        {location.name}

                    </option>

                ))}

            </select>

            <select
                value={pointId}
                onChange={(e)=>setPointId(e.target.value)}
            >

                <option value="">
                    Location Point
                </option>

                {points.map(point=>(

                    <option
                        key={point.id}
                        value={point.id}
                    >

                        {point.name}

                    </option>

                ))}

            </select>

        </div>

    );

}