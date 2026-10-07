import Header from "../components/Header";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../index.css";
import { useEffect, useState } from "react";

const Map = () => {

    const [trip, setTrip] = useState(false);

    const position = [-22.5609, 17.0658];

    const [start, setStart] = useState("");
    const [destination, setDestination] = useState("");
    const [stops, setStops] = useState([]);
    const [newStop, setNewStop] = useState("");
    const [addingStop, setAddingStop] = useState(false);

    const [duration, setDuration] = useState("");
    const [distance, setDistance] = useState("");
    const [markers, setMarkers] = useState([]);
    const [route, setRoute] = useState([]);
    const [eta, setEta] = useState("");
    const [etastops, setetastops] = useState([]);

    const [startSuggestions, setStartSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [stopSuggestions, setStopSuggestions] = useState([]);

    const [showStartSuggestions, setShowStartSuggestions] = useState(false);
    const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
    const [showStopSuggestions, setShowStopSuggestions] = useState(false);

    useEffect(() => {
        if (!start.trim() || start.length < 3) {
            setStartSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const url =
                    `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(start)}` +
                    `&format=jsonv2` +
                    `&addressdetails=1` +
                    `&limit=5` +
                    `&countrycodes=na`;

                const response = await fetch(url);
                const data = await response.json();

                setStartSuggestions(data);
            } catch (error) {
                console.error(error);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [start]);

    useEffect(() => {
        if (!destination.trim() || destination.length < 3) {
            setDestinationSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const url =
                    `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(destination)}` +
                    `&format=jsonv2` +
                    `&addressdetails=1` +
                    `&limit=5` +
                    `&countrycodes=na`;

                const response = await fetch(url);
                const data = await response.json();

                setDestinationSuggestions(data);
            } catch (error) {
                console.error(error);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [destination]);

    useEffect(() => {
        if (!newStop.trim() || newStop.length < 3) {
            setStopSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const url =
                    `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(newStop)}` +
                    `&format=jsonv2` +
                    `&addressdetails=1` +
                    `&limit=5` +
                    `&countrycodes=na`;

                const response = await fetch(url);
                const data = await response.json();

                setStopSuggestions(data);
            } catch (error) {
                console.error(error);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [newStop]);

    const handleEndTrip = () => {
        setTrip(false);
        setStart("");
        setDestination("");
        setStops([]);
        setNewStop("");
        setAddingStop(false);
        setMarkers([]);
        setRoute([]);
        setDistance("");
        setDuration("");
        setEta("");
        setetastops([]);
        setStartSuggestions([]);
        setDestinationSuggestions([]);
        setStopSuggestions([]);
        setShowStartSuggestions(false);
        setShowDestinationSuggestions(false);
        setShowStopSuggestions(false);
    };

    const handleAddStop = () => {
        setAddingStop(true);
        setNewStop("");
        setShowStopSuggestions(false);
    };

    const handleAddTripStop = () => {
        setAddingStop(true);
        setNewStop("");
        setShowStopSuggestions(false);
    };

    const handleDeleteStop = (index) => {
        const updatedStops = stops.filter(
            (_, stopIndex) => stopIndex !== index
        );

        setStops(updatedStops);

        if (trip) {
            calculateRoute(updatedStops);
        }
    };

    const handleStartSuggestion = (suggestion) => {
        setStart(suggestion.display_name);
        setStartSuggestions([]);
        setShowStartSuggestions(false);
    };

    const handleDestinationSuggestion = (suggestion) => {
        setDestination(suggestion.display_name);
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
    };

    const handleNewStopSuggestion = (suggestion) => {
        setNewStop(suggestion.display_name);
        setStopSuggestions([]);
        setShowStopSuggestions(false);
    };

    const geocode = async (place) => {
        const url =
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(place)}` +
            `&format=jsonv2&limit=1`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to find location.");
        }

        const data = await response.json();

        if (!data.length) {
            throw new Error(`Location not found: ${place}`);
        }

        return {
            lat: Number(data[0].lat),
            lon: Number(data[0].lon),
            name: data[0].display_name
        };
    };

    const calculateRoute = async (routeStops = stops) => {
        if (!start.trim() || !destination.trim()) {
            alert("Please enter a starting point and destination.");
            return;
        }

        try {
            const places = [
                start,
                ...routeStops.filter((stop) => stop.trim()),
                destination
            ];

            const locations = [];

            for (const place of places) {
                const location = await geocode(place);
                locations.push(location);
            }

            setMarkers(locations);

            const coordinates = locations
                .map((location) => `${location.lon},${location.lat}`)
                .join(";");

            const routeUrl =
                `https://router.project-osrm.org/route/v1/driving/` +
                `${coordinates}` +
                `?overview=full&geometries=geojson&steps=true`;

            const response = await fetch(routeUrl);

            if (!response.ok) {
                throw new Error("Unable to calculate route.");
            }

            const data = await response.json();

            if (!data.routes || !data.routes.length) {
                throw new Error("No route was found.");
            }

            const selectedRoute = data.routes[0];

            const routeCoordinates =
                selectedRoute.geometry.coordinates.map(
                    ([lon, lat]) => [lat, lon]
                );

            setDistance(
                (selectedRoute.distance / 1000).toFixed(2)
            );

            setDuration(
                Math.round(selectedRoute.duration / 60)
            );

            const arrivalTime = new Date(
                Date.now() + selectedRoute.duration * 1000
            );

            setEta(
                arrivalTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                })
            );

            const legs = selectedRoute.legs;

            let accumulatedDuration = 0;

            const etaStops = legs.map((leg) => {
                accumulatedDuration += leg.duration;

                const stopArrivalTime = new Date(
                    Date.now() + accumulatedDuration * 1000
                );

                return stopArrivalTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });
            });

            const stopsWithEta = locations.map(
                (location, index) => ({
                    location,
                    eta:
                        index === 0
                            ? new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                            })
                            : etaStops[index - 1]
                })
            );

            setetastops(stopsWithEta);
            setRoute(routeCoordinates);
            setTrip(true);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const addTripStop = () => {
        if (!newStop.trim()) {
            alert("Please enter a stop.");
            return;
        }

        const updatedStops = [
            ...stops,
            newStop.trim()
        ];

        setStops(updatedStops);
        setNewStop("");
        setAddingStop(false);
        setStopSuggestions([]);
        setShowStopSuggestions(false);

        calculateRoute(updatedStops);
    };

    const getMarkerLabel = (index, total) => {
        if (index === 0) {
            return "START";
        }

        if (index === total - 1) {
            return "DESTINATION";
        }

        return `STOP ${index}`;
    };

    return (
        <div className="container">

            <Header />

            <div className="main">

                <aside className="aside">

                    {trip === false ? (
                        <div className="sidebar-content">

                            <div className="sidebar-header">
                                <span className="sidebar-label">
                                    ROUTE PLANNER
                                </span>

                                <h1>
                                    Configure Route
                                </h1>

                                <p>
                                    Add your origin, destination and stops to calculate your route.
                                </p>
                            </div>

                            <form className="route-form">

                                <div className="des-inputs">

                                    <div className="location-field">

                                        <label>
                                            STARTING POINT
                                        </label>

                                        <textarea
                                            placeholder="Enter starting location"
                                            value={start}
                                            onChange={(e) => {
                                                setStart(e.target.value);
                                                setShowStartSuggestions(true);
                                            }}
                                            onFocus={() =>
                                                setShowStartSuggestions(true)
                                            }
                                        />

                                        {showStartSuggestions &&
                                            startSuggestions.length > 0 && (
                                                <div className="location-suggestions">
                                                    {startSuggestions.map(
                                                        (suggestion) => (
                                                            <button
                                                                type="button"
                                                                key={suggestion.place_id}
                                                                onClick={() =>
                                                                    handleStartSuggestion(
                                                                        suggestion
                                                                    )
                                                                }
                                                            >
                                                                {suggestion.display_name}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                    </div>

                                    <div className="location-field">

                                        <label>
                                            DESTINATION
                                        </label>

                                        <textarea
                                            placeholder="Enter destination"
                                            value={destination}
                                            onChange={(e) => {
                                                setDestination(e.target.value);
                                                setShowDestinationSuggestions(true);
                                            }}
                                            onFocus={() =>
                                                setShowDestinationSuggestions(true)
                                            }
                                        />

                                        {showDestinationSuggestions &&
                                            destinationSuggestions.length > 0 && (
                                                <div className="location-suggestions">
                                                    {destinationSuggestions.map(
                                                        (suggestion) => (
                                                            <button
                                                                type="button"
                                                                key={suggestion.place_id}
                                                                onClick={() =>
                                                                    handleDestinationSuggestion(
                                                                        suggestion
                                                                    )
                                                                }
                                                            >
                                                                {suggestion.display_name}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                    </div>

                                    {stops.map((stop, index) => (
                                        <div
                                            className="location-field"
                                            key={index}
                                        >

                                            <div className="field-header">

                                                <label>
                                                    STOP {index + 1}
                                                </label>

                                                <button
                                                    type="button"
                                                    className="remove-stop"
                                                    onClick={() =>
                                                        handleDeleteStop(index)
                                                    }
                                                >
                                                    REMOVE
                                                </button>

                                            </div>

                                            <textarea
                                                placeholder={`Stop ${index + 1}`}
                                                value={stop}
                                                readOnly
                                            />

                                        </div>
                                    ))}

                                    {addingStop && (
                                        <div className="location-field">

                                            <label>
                                                NEW INTERMEDIATE STOP
                                            </label>

                                            <textarea
                                                placeholder="Enter stop location"
                                                value={newStop}
                                                onChange={(e) => {
                                                    setNewStop(e.target.value);
                                                    setShowStopSuggestions(true);
                                                }}
                                                onFocus={() =>
                                                    setShowStopSuggestions(true)
                                                }
                                            />

                                            {showStopSuggestions &&
                                                stopSuggestions.length > 0 && (
                                                    <div className="location-suggestions">
                                                        {stopSuggestions.map(
                                                            (suggestion) => (
                                                                <button
                                                                    type="button"
                                                                    key={suggestion.place_id}
                                                                    onClick={() =>
                                                                        handleNewStopSuggestion(
                                                                            suggestion
                                                                        )
                                                                    }
                                                                >
                                                                    {suggestion.display_name}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                            <button
                                                type="button"
                                                className="cancel-stop"
                                                onClick={() => {
                                                    setAddingStop(false);
                                                    setNewStop("");
                                                    setStopSuggestions([]);
                                                    setShowStopSuggestions(false);
                                                }}
                                            >
                                                CANCEL
                                            </button>

                                        </div>
                                    )}

                                </div>

                                <div className="aside-buttons">

                                    {!addingStop && (
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={handleAddStop}
                                        >
                                            + Add Intermediate Stop
                                        </button>
                                    )}

                                    {addingStop && (
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={addTripStop}
                                        >
                                            Add Stop
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={() => calculateRoute()}
                                    >
                                        Start Trip
                                    </button>

                                </div>

                            </form>

                        </div>
                    ) : (
                        <div className="sidebar-content">

                            <div className="sidebar-header">

                                <span className="sidebar-label">
                                    ACTIVE TRIP
                                </span>

                                <h1>
                                    Route Summary
                                </h1>

                            </div>

                            <div className="route-summary">

                                <div className="summary-header">
                                    <span>
                                        OPTIMIZATION SUMMARY
                                    </span>
                                </div>

                                <div className="distance">

                                    <div>
                                        <span>
                                            TIME
                                        </span>

                                        <strong>
                                            {duration} min
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            DISTANCE
                                        </span>

                                        <strong>
                                            {distance} km
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            ETA
                                        </span>

                                        <strong>
                                            {eta}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            <div className="stops-section">

                                <div className="section-heading">
                                    <span>
                                        ROUTE STOPS
                                    </span>

                                    <span>
                                        {etastops.length}
                                    </span>
                                </div>

                                <section className="stops">

                                    {etastops.map((item, index) => (
                                        <div
                                            className="stop-card"
                                            key={index}
                                        >

                                            <div className="stop-card-index">
                                                {index === 0
                                                    ? "S"
                                                    : index === etastops.length - 1
                                                        ? "D"
                                                        : index}
                                            </div>

                                            <div className="stop-card-time">

                                                <h6>
                                                    {getMarkerLabel(
                                                        index,
                                                        etastops.length
                                                    )}
                                                </h6>

                                                <p>
                                                    {item.location.name}
                                                </p>

                                                <span>
                                                    {item.eta}
                                                </span>

                                            </div>

                                            {index > 0 &&
                                                index < etastops.length - 1 && (
                                                    <button
                                                        type="button"
                                                        className="remove-stop"
                                                        onClick={() =>
                                                            handleDeleteStop(index - 1)
                                                        }
                                                    >
                                                        REMOVE
                                                    </button>
                                                )}

                                        </div>
                                    ))}

                                </section>

                            </div>

                            {addingStop && (
                                <div className="active-stop-form">

                                    <label>
                                        NEW INTERMEDIATE STOP
                                    </label>

                                    <div className="location-field">

                                        <textarea
                                            placeholder="Enter stop location"
                                            value={newStop}
                                            onChange={(e) => {
                                                setNewStop(e.target.value);
                                                setShowStopSuggestions(true);
                                            }}
                                            onFocus={() =>
                                                setShowStopSuggestions(true)
                                            }
                                        />

                                        {showStopSuggestions &&
                                            stopSuggestions.length > 0 && (
                                                <div className="location-suggestions">
                                                    {stopSuggestions.map(
                                                        (suggestion) => (
                                                            <button
                                                                type="button"
                                                                key={suggestion.place_id}
                                                                onClick={() =>
                                                                    handleNewStopSuggestion(
                                                                        suggestion
                                                                    )
                                                                }
                                                            >
                                                                {suggestion.display_name}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                    </div>

                                    <div className="active-stop-actions">

                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => {
                                                setAddingStop(false);
                                                setNewStop("");
                                                setStopSuggestions([]);
                                                setShowStopSuggestions(false);
                                            }}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            className="primary-button"
                                            onClick={addTripStop}
                                        >
                                            Recalculate Route
                                        </button>

                                    </div>

                                </div>
                            )}

                            <div className="aside-buttons">

                                <button
                                    type="button"
                                    className="danger-button"
                                    onClick={handleEndTrip}
                                >
                                    End Trip
                                </button>

                                {!addingStop && (
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={handleAddTripStop}
                                    >
                                        + Add Intermediate Stop
                                    </button>
                                )}

                            </div>

                        </div>
                    )}

                </aside>

                <main className="map-display">

                    <MapContainer
                        center={position}
                        zoom={13}
                        className="leaflet-map"
                    >

                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {markers.map((marker, index) => (
                            <Marker
                                key={index}
                                position={[
                                    marker.lat,
                                    marker.lon
                                ]}
                            >
                                <Popup>
                                    <strong>
                                        {getMarkerLabel(
                                            index,
                                            markers.length
                                        )}
                                    </strong>

                                    <br />

                                    {marker.name}
                                </Popup>
                            </Marker>
                        ))}

                        {route.length > 0 && (
                            <Polyline
                                positions={route}
                            />
                        )}

                    </MapContainer>

                </main>

            </div>

        </div>
    );
};

export default Map;

