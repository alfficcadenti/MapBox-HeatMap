/* global window, fetch */
import React, {Component} from 'react';
import ReactMapGL from 'react-map-gl';
import {json as requestJson} from 'd3-request';

const MAPBOX_TOKEN = '...'; // Set your mapbox token here
const HEATMAP_SOURCE_ID = "geo-source";


export default class Geo extends Component {
    constructor(props) {
        super(props)
        this.state = {
            initialVisibility: true,
            viewport: {
                width: 600,
                height: 600,
                latitude: 35.96,
                longitude: -39.33,
                zoom: 1
            }
        };

        this._mapRef = React.createRef();

    }

    _mkHeatmapLayer = (id, source) => {
        const MAX_ZOOM_LEVEL = 15;
        return {
            id,
            source,
            maxzoom: MAX_ZOOM_LEVEL,
            type: 'heatmap',
            paint: {
                // Increase the heatmap weight based on frequency and property RPS
                "heatmap-weight": [
                    "interpolate",
                    ["linear"],
                    ["get", "rps"],
                    1, 1,
                    10,2,
                    100,3,
                    2000, 4,
                    5000, 5
                ],
                // Increase the heatmap color weight weight by zoom level
                // heatmap-intensity is a multiplier on top of heatmap-weight
                "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 0.3, //first value is the zoom level, second is the intensity
                    MAX_ZOOM_LEVEL, 1 //first value is the zoom level, second is the intensity
                ],
                // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
                // Begin color ramp at 0-stop with a 0-transparancy color
                // to create a blur-like effect.
                "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0, "rgba(33,102,172,0)",
                    0.2, "rgba(255,255,255,0.9)",
                    0.7, "rgba(103,169,207,0.99)",
                    //1, "rgba(0,17,255,0.99)",
                    
                ],
                // Adjust the heatmap radius by zoom level
                "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["get", "rps"],
                    1, 1,
                    10,3,
                    400,20,
                    2500, 50,
                    5000, 100
                    
                ],
                // Transition from heatmap to circle layer by zoom level
                "heatmap-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 1,
                    MAX_ZOOM_LEVEL, 1
                ],
            }
        }
    };

    _handleMapLoaded = event => {
        const map = this._getMap();

        requestJson('ADDRESS FOR HTTP REQUEST OF A GEO-JSON FILE', (error, response) => {
            if (!error) {
                // Note: In a real application you would do a validation of JSON data before doing anything with it,
                // but for demonstration purposes we ingore this part here and just trying to select needed data...
                //const features = response.stats;
                map.addSource(HEATMAP_SOURCE_ID, {type: "geojson", data: response.stats});
                map.addLayer(this._mkHeatmapLayer("heatmap-layer", HEATMAP_SOURCE_ID));
                
            }
        });
    };

    _getMap = () => {
        return this._mapRef.current ? this._mapRef.current.getMap() : null;
    }

    _onViewportChange = viewport => this.setState({viewport});

    render() {
        var className = this.props.visibility ? 'visible' : 'hidden';
        let {viewport} = this.state;
        return (
            <div className={className}  id='mapContainer'>
                <ReactMapGL
                    ref={this._mapRef}
                    {...viewport}
                    width='100%'
                    mapStyle="mapbox://styles/mapbox/dark-v8"
                    onViewportChange={this._onViewportChange}
                    mapboxApiAccessToken={MAPBOX_TOKEN}
                    onLoad={this._handleMapLoaded}
                />
            </div>
        );
    }
}

