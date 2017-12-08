import { Location, LocationManager, LocationEvent, Acceleration, MotionEvent, AccelerometerEvent, Heading, GyroscopeEvent } from './locationManager'
import KalmanFilter from 'kalmanjs';
export { Location } from './locationManager'
const MAX_VISIBLE_ANNOTATIONS = 500// Do not change, can affect performance

export function CoordinateIsValid(loc: Location) {
    return true;
}
/**
 Distance offset mode, it affects vertical offset of annotations by distance.
 */
export enum DistanceOffsetMode {
    /// Annotations are not offset vertically with distance.
    none,
    /// Use distanceOffsetMultiplier and distanceOffsetMinThreshold to control offset.
    manual,
    /// distanceOffsetMinThreshold is set to closest annotation, distanceOffsetMultiplier must be set by user.
    automaticOffsetMinDistance,
    /**
     distanceOffsetMinThreshold is set to closest annotation and distanceOffsetMultiplier
     is set to fit all annotations on screen vertically(before stacking)
     */
    automatic
}

/// Note that raw values are important because of pendingHighestRankingReload
export enum ReloadType {
    headingChanged = 0,
    userLocationChanged = 1,
    reloadLocationChanged = 2,
    annotationsChanged = 3
}

export interface ARTrackingManagerDelegate {
    didUpdateUserLocation(trackingManager: ARTrackingManager, location: Location)
    didUpdateReloadLocation(trackingManager: ARTrackingManager, location: Location)
    didFailToFindLocationAfter(trackingManager: ARTrackingManager, elapsedSeconds: number)
    didUpdateMotion(trackingManager: ARTrackingManager, pitch: number, heading: number, orientation?: number[])
    // didUpdateHeading(trackingManager: ARTrackingManager, heading: number)
    logText(text: string)
}



/**
 * Utility class to compute a table of Gauss-normalized associated Legendre
 * functions P_n^m(cos(theta))
 */
class LegendreTable {
    // These are the Gauss-normalized associated Legendre functions -- that
    // is, they are normal Legendre functions multiplied by
    // (n-m)!/(2n-1)!! (where (2n-1)!! = 1*3*5*...*2n-1)
    mP

    // Derivative of mP, with respect to theta.
    mPDeriv

    /**
     * @param maxN
     *            The maximum n- and m-values to support
     * @param thetaRad
     *            Returned functions will be Gauss-normalized
     *            P_n^m(cos(thetaRad)), with thetaRad in radians.
     */
    constructor(maxN, thetaRad) {
        // Compute the table of Gauss-normalized associated Legendre
        // functions using standard recursion relations. Also compute the
        // table of derivatives using the derivative of the recursion
        // relations.
        let cos =  Math.cos(thetaRad);
        let sin =  Math.sin(thetaRad);

        this.mP = Array(maxN + 1);
        this.mPDeriv = Array(maxN + 1);
        this.mP[0] = [ 1.0];
        this.mPDeriv[0] = [ 0.0 ];
        const mP = this.mP;
        const mPDeriv = this.mPDeriv;
        for (let n = 1; n <= maxN; n++) {
            mP[n] = Array(n + 1);
            mPDeriv[n] = Array(n + 1);
            for (let m = 0; m <= n; m++) {
                if (n == m) {
                    mP[n][m] = sin * mP[n - 1][m - 1];
                    mPDeriv[n][m] = cos * mP[n - 1][m - 1]
                        + sin * mPDeriv[n - 1][m - 1];
                } else if (n == 1 || m == n - 1) {
                    mP[n][m] = cos * mP[n - 1][m];
                    mPDeriv[n][m] = -sin * mP[n - 1][m]
                        + cos * mPDeriv[n - 1][m];
                } else {
                    // assert n > 1 && m < n - 1;
                    const k = ((n - 1) * (n - 1) - m * m)
                        / ((2 * n - 1) * (2 * n - 3));
                    mP[n][m] = cos * mP[n - 1][m] - k * mP[n - 2][m];
                    mPDeriv[n][m] = -sin * mP[n - 1][m]
                        + cos * mPDeriv[n - 1][m] - k * mPDeriv[n - 2][m];
                }
            }
        }
    }
}
/**
 * Estimates magnetic field at a given point on
 * Earth, and in particular, to compute the magnetic declination from true
 * north.
 *
 * <p>This uses the World Magnetic Model produced by the United States National
 * Geospatial-Intelligence Agency.  More details about the model can be found at
 * <a href="http://www.ngdc.noaa.gov/geomag/WMM/DoDWMM.shtml">http://www.ngdc.noaa.gov/geomag/WMM/DoDWMM.shtml</a>.
 * This class currently uses WMM-2010 which is valid until 2015, but should
 * produce acceptable results for several years after that. Future versions of
 * Android may use a newer version of the model.
 */
export class GeomagneticField {
    // The magnetic field at a given point, in nonoteslas in geodetic
    // coordinates.
    private mX
    private mY
    private mZ

    // Geocentric coordinates -- set by computeGeocentricCoordinates.
    private mGcLatitudeRad;
    private mGcLongitudeRad;
    private mGcRadiusKm;

    // Constants from WGS84 (the coordinate system used by GPS)
    static EARTH_SEMI_MAJOR_AXIS_KM = 6378.137
    static EARTH_SEMI_MINOR_AXIS_KM = 6356.7523142
    static EARTH_REFERENCE_RADIUS_KM = 6371.2

    // These coefficients and the formulae used below are from:
    // NOAA Technical Report: The US/UK World Magnetic Model for 2010-2015
    static G_COEFF = [
        [0.0],
        [-29496.6, -1586.3],
        [-2396.6, 3026.1, 1668.6],
        [1340., -2326.2, 1231.9, 634.0],
        [912.6, 808.9, 166.7, -357.1, 89.4],
        [-230.9, 357.2, 200.3, -141.1, -163.0, -7.8],
        [72.8, 68.6, 76.0, -141.4, -22.8, 13.2, -77.9],
        [80.5, -75.1, -4.7, 45.3, 13.9, 10.4, 1.7, 4.9],
        [24.4, 8.1, -14.5, -5.6, -19.3, 11.5, 10.9, -14.1, -3.7],
        [5.4, 9.4, 3.4, -5.2, 3.1, -12.4, -0.7, 8.4, -8.5, -10.1],
        [-2.0, -6.3, 0.9, -1.1, -0.2, 2.5, -0.3, 2.2, 3.1, -1.0, -2.8],
        [3.0, -1.5, -2.1, 1.7, -0.5, 0.5, -0.8, 0.4, 1.8, 0.1, 0.7, 3.8],
        [-2.2, -0.2, 0.3, 1.0, -0.6, 0.9, -0.1, 0.5, -0.4, -0.4, 0.2, -0.8, 0.0]];

    static H_COEFF = [
        [0.0],
        [0.0, 4944.4],
        [0.0, -2707.7, -576.1],
        [0.0, -160.2, 251.9, -536.6],
        [0.0, 286.4, -211.2, 164.3, -309.1],
        [0.0, 44.6, 188.9, -118.2, 0.0, 100.9],
        [0.0, -20.8, 44.1, 61.5, -66.3, 3.1, 55.0],
        [0.0, -57.9, -21.1, 6.5, 24.9, 7.0, -27.7, -3.3],
        [0.0, 11.0, -20.0, 11.9, -17.4, 16.7, 7.0, -10.8, 1.7],
        [0.0, -20.5, 11.5, 12.8, -7.2, -7.4, 8.0, 2.1, -6.1, 7.0],
        [0.0, 2.8, -0.1, 4.7, 4.4, -7.2, -1.0, -3.9, -2.0, -2.0, -8.3],
        [0.0, 0.2, 1.7, -0.6, -1.8, 0.9, -0.4, -2.5, -1.3, -2.1, -1.9, -1.8],
        [0.0, -0.9, 0.3, 2.1, -2.5, 0.5, 0.6, 0.0, 0.1, 0.3, -0.9, -0.2, 0.9]];

    static DELTA_G = [
        [0.0],
        [11.6, 16.5],
        [-12.1, -4.4, 1.9],
        [0.4, -4.1, -2.9, -7.7],
        [-1.8, 2.3, -8.7, 4.6, -2.1],
        [-1.0, 0.6, -1.8, -1.0, 0.9, 1.0],
        [-0.2, -0.2, -0.1, 2.0, -1.7, -0.3, 1.7],
        [0.1, -0.1, -0.6, 1.3, 0.4, 0.3, -0.7, 0.6],
        [-0.1, 0.1, -0.6, 0.2, -0.2, 0.3, 0.3, -0.6, 0.2],
        [0.0, -0.1, 0.0, 0.3, -0.4, -0.3, 0.1, -0.1, -0.4, -0.2],
        [0.0, 0.0, -0.1, 0.2, 0.0, -0.1, -0.2, 0.0, -0.1, -0.2, -0.2],
        [0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1, 0.0],
        [0.0, 0.0, 0.1, 0.1, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1, 0.1]];

    static DELTA_H = [
        [0.0],
        [0.0, -25.9],
        [0.0, -22.5, -11.8],
        [0.0, 7.3, -3.9, -2.6],
        [0.0, 1.1, 2.7, 3.9, -0.8],
        [0.0, 0.4, 1.8, 1.2, 4.0, -0.6],
        [0.0, -0.2, -2.1, -0.4, -0.6, 0.5, 0.9],
        [0.0, 0.7, 0.3, -0.1, -0.1, -0.8, -0.3, 0.3],
        [0.0, -0.1, 0.2, 0.4, 0.4, 0.1, -0.1, 0.4, 0.3],
        [0.0, 0.0, -0.2, 0.0, -0.1, 0.1, 0.0, -0.2, 0.3, 0.2],
        [0.0, 0.1, -0.1, 0.0, -0.1, -0.1, 0.0, -0.1, -0.2, 0.0, -0.1],
        [0.0, 0.0, 0.1, 0.0, 0.1, 0.0, 0.1, 0.0, -0.1, -0.1, 0.0, -0.1],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]];

    // static BASE_TIME = new GregorianCalendar(2010, 1, 1).getTimeInMillis();

    // The ratio between the Gauss-normalized associated Legendre functions and
    // the Schmid quasi-normalized ones. Compute these once staticly since they
    // don't depend on input variables at all.
    static SCHMIDT_QUASI_NORM_FACTORS =
        GeomagneticField.computeSchmidtQuasiNormFactors(GeomagneticField.G_COEFF.length);

    /**
     * Estimate the magnetic field at a given point and time.
     *
     * @param gdLatitudeDeg
     *            Latitude in WGS84 geodetic coordinates -- positive is east.
     * @param gdLongitudeDeg
     *            Longitude in WGS84 geodetic coordinates -- positive is north.
     * @param altitudeMeters
     *            Altitude in WGS84 geodetic coordinates, in meters.
     * @param timeMillis
     *            Time at which to evaluate the declination, in milliseconds
     *            since January 1, 1970. (approximate is fine -- the declination
     *            changes very slowly).
     */
    constructor(gdLatitudeDeg,
        gdLongitudeDeg,
        altitudeMeters,
        timeMillis) {
        const MAX_N = GeomagneticField.G_COEFF.length; // Maximum degree of the coefficients.

        // We don't handle the north and south poles correctly -- pretend that
        // we're not quite at them to avoid crashing.
        gdLatitudeDeg = Math.min(90.0 - 1e-5,
            Math.max(-90.0 + 1e-5, gdLatitudeDeg));
        this.computeGeocentricCoordinates(gdLatitudeDeg,
            gdLongitudeDeg,
            altitudeMeters);

        // assert G_COEFF.length == H_COEFF.length;

        // Note: LegendreTable computes associated Legendre functions for
        // cos(theta).  We want the associated Legendre functions for
        // sin(latitude), which is the same as cos(PI/2 - latitude), except the
        // derivate will be negated.
        const legendre =
            new LegendreTable(MAX_N - 1, (Math.PI / 2.0 - this.mGcLatitudeRad));

        // Compute a table of (EARTH_REFERENCE_RADIUS_KM / radius)^n for i in
        // 0..MAX_N-2 (this is much faster than calling Math.pow MAX_N+1 times).
        const relativeRadiusPower = [];
        relativeRadiusPower[0] = 1.0;
        relativeRadiusPower[1] = GeomagneticField.EARTH_REFERENCE_RADIUS_KM / this.mGcRadiusKm;
        for (let i = 2; i < relativeRadiusPower.length; ++i) {
            relativeRadiusPower[i] = relativeRadiusPower[i - 1] *
                relativeRadiusPower[1];
        }

        // Compute tables of sin(lon * m) and cos(lon * m) for m = 0..MAX_N --
        // this is much faster than calling Math.sin and Math.com MAX_N+1 times.
        let sinMLon = [];
        let cosMLon = [];
        sinMLon[0] = 0.0;
        cosMLon[0] = 1.0;
        sinMLon[1] = Math.sin(this.mGcLongitudeRad);
        cosMLon[1] = Math.cos(this.mGcLongitudeRad);

        for (let m = 2; m < MAX_N; ++m) {
            // Standard expansions for sin((m-x)*theta + x*theta) and
            // cos((m-x)*theta + x*theta).
            const x = m >> 1;
            sinMLon[m] = sinMLon[m - x] * cosMLon[x] + cosMLon[m - x] * sinMLon[x];
            cosMLon[m] = cosMLon[m - x] * cosMLon[x] - sinMLon[m - x] * sinMLon[x];
        }

        const inverseCosLatitude = 1.0 / Math.cos(this.mGcLatitudeRad);
        const yearsSinceBase =
            (timeMillis - GeomagneticField.BASE_TIME) / (365 * 24 * 60 * 60 * 1000);

        // We now compute the magnetic field strength given the geocentric
        // location. The magnetic field is the derivative of the potential
        // function defined by the model. See NOAA Technical Report: The US/UK
        // World Magnetic Model for 2010-2015 for the derivation.
        let gcX = 0.0;  // Geocentric northwards component.
        let gcY = 0.0;  // Geocentric eastwards component.
        let gcZ = 0.0;  // Geocentric downwards component.

        for (let n = 1; n < MAX_N; n++) {
            for (let m = 0; m <= n; m++) {
                // Adjust the coefficients for the current date.
                const g = GeomagneticField.G_COEFF[n][m] + yearsSinceBase * GeomagneticField.DELTA_G[n][m];
                const h = GeomagneticField.H_COEFF[n][m] + yearsSinceBase * GeomagneticField.DELTA_H[n][m];

                // Negative derivative with respect to latitude, divided by
                // radius.  This looks like the negation of the version in the
                // NOAA Techincal report because that report used
                // P_n^m(sin(theta)) and we use P_n^m(cos(90 - theta)), so the
                // derivative with respect to theta is negated.
                gcX += relativeRadiusPower[n + 2]
                    * (g * cosMLon[m] + h * sinMLon[m])
                    * legendre.mPDeriv[n][m]
                    * GeomagneticField.SCHMIDT_QUASI_NORM_FACTORS[n][m];

                // Negative derivative with respect to longitude, divided by
                // radius.
                gcY += relativeRadiusPower[n + 2] * m
                    * (g * sinMLon[m] - h * cosMLon[m])
                    * legendre.mP[n][m]
                    * GeomagneticField.SCHMIDT_QUASI_NORM_FACTORS[n][m]
                    * inverseCosLatitude;

                // Negative derivative with respect to radius.
                gcZ -= (n + 1) * relativeRadiusPower[n + 2]
                    * (g * cosMLon[m] + h * sinMLon[m])
                    * legendre.mP[n][m]
                    * GeomagneticField.SCHMIDT_QUASI_NORM_FACTORS[n][m];
            }
        }

        // Convert back to geodetic coordinates.  This is basically just a
        // rotation around the Y-axis by the difference in latitudes between the
        // geocentric frame and the geodetic frame.
        const latDiffRad = degreesToRadians(gdLatitudeDeg) - this.mGcLatitudeRad;
        this.mX = (gcX * Math.cos(latDiffRad)
            + gcZ * Math.sin(latDiffRad));
        this.mY = gcY;
        this.mZ = (- gcX * Math.sin(latDiffRad)
            + gcZ * Math.cos(latDiffRad));
    }

    /**
     * @return The X (northward) component of the magnetic field in nanoteslas.
     */
    public getX() {
        return this.mX;
    }

    /**
     * @return The Y (eastward) component of the magnetic field in nanoteslas.
     */
    public getY() {
        return this.mY;
    }

    /**
     * @return The Z (downward) component of the magnetic field in nanoteslas.
     */
    public getZ() {
        return this.mZ;
    }

    /**
     * @return The declination of the horizontal component of the magnetic
     *         field from true north, in degrees (i.e. positive means the
     *         magnetic field is rotated east that much from true north).
     */
    public getDeclination() {
        return degreesToRadians(Math.atan2(this.mY, this.mX));
    }

    /**
     * @return The inclination of the magnetic field in degrees -- positive
     *         means the magnetic field is rotated downwards.
     */
    public getInclination() {
        return degreesToRadians(Math.atan2(this.mZ,
            this.getHorizontalStrength()));
    }

    /**
     * @return  Horizontal component of the field strength in nonoteslas.
     */
    public getHorizontalStrength() {
        return Math.hypot(this.mX, this.mY);
    }

    /**
     * @return  Total field strength in nanoteslas.
     */
    public getFieldStrength() {
        return Math.sqrt(this.mX * this.mX + this.mY * this.mY + this.mZ * this.mZ);
    }

    /**
     * @param gdLatitudeDeg
     *            Latitude in WGS84 geodetic coordinates.
     * @param gdLongitudeDeg
     *            Longitude in WGS84 geodetic coordinates.
     * @param altitudeMeters
     *            Altitude above sea level in WGS84 geodetic coordinates.
     * @return Geocentric latitude (i.e. angle between closest point on the
     *         equator and this point, at the center of the earth.
     */
    private computeGeocentricCoordinates(gdLatitudeDeg,
        gdLongitudeDeg,
        altitudeMeters) {
        let altitudeKm = altitudeMeters / 1000.0;
        let a2 = GeomagneticField.EARTH_SEMI_MAJOR_AXIS_KM * GeomagneticField.EARTH_SEMI_MAJOR_AXIS_KM;
        let b2 = GeomagneticField.EARTH_SEMI_MINOR_AXIS_KM * GeomagneticField.EARTH_SEMI_MINOR_AXIS_KM;
        let gdLatRad = degreesToRadians(gdLatitudeDeg);
        let clat = Math.cos(gdLatRad);
        let slat = Math.sin(gdLatRad);
        let tlat = slat / clat;
        let latRad =
            Math.sqrt(a2 * clat * clat + b2 * slat * slat);

        this.mGcLatitudeRad = Math.atan(tlat * (latRad * altitudeKm + b2)
            / (latRad * altitudeKm + a2));

        this.mGcLongitudeRad = degreesToRadians(gdLongitudeDeg);

        let radSq = altitudeKm * altitudeKm
            + 2 * altitudeKm * Math.sqrt(a2 * clat * clat +
                b2 * slat * slat)
            + (a2 * a2 * clat * clat + b2 * b2 * slat * slat)
            / (a2 * clat * clat + b2 * slat * slat);
        this.mGcRadiusKm = Math.sqrt(radSq);
    }
    /**
     * Compute the ration between the Gauss-normalized associated Legendre
     * functions and the Schmidt quasi-normalized version. This is equivalent to
     * sqrt((m==0?1:2)*(n-m)!/(n+m!))*(2n-1)!!/(n-m)!
     */
    private static computeSchmidtQuasiNormFactors(maxN) {
        let schmidtQuasiNorm = Array(maxN + 1);
        schmidtQuasiNorm[0] =[ 1.0];
        for (let n = 1; n <= maxN; n++) {
            schmidtQuasiNorm[n] = Array(n + 1);
            schmidtQuasiNorm[n][0] =
                schmidtQuasiNorm[n - 1][0] * (2 * n - 1) /  n;
            for (let m = 1; m <= n; m++) {
                schmidtQuasiNorm[n][m] = schmidtQuasiNorm[n][m - 1]
                    *  Math.sqrt((n - m + 1) * (m == 1 ? 2 : 1)
                        / (n + m));
            }
        }
        return schmidtQuasiNorm;
    }
}


/**
 Class used internally by ARViewController for tracking and filtering location/heading/pitch etc.
 ARViewController takes all these informations and stores them in ARViewController.arStatus object,
 which is then passed to ARPresenter. Not intended for subclassing.
 */
export class ARTrackingManager {
    /**
     Specifies how often are new annotations fetched and annotation views are recreated.
     Default value is 50m.
     */
    reloadDistanceFilter: number    // Will be set in init

    /**
     Specifies how often are distances and azimuths recalculated for visible annotations. Stacking is also done on this which is heavy operation.
     Default value is 15m.
     */
    userDistanceFilter: number      // Will be set in init
    // {
    //     didSet
    //     {
    //         this.locationManager.distanceFilter = this.userDistanceFilter
    //     }
    // }

    /**
     Filter(Smoothing) factor for heading in range 0-1. It affects horizontal movement of annotaion views. The lower the value the bigger the smoothing.
     Value of 1 means no smoothing, should be greater than 0. Default value is 0.05
     */
    headingFilterFactor = 0.07
    _headingFilterFactor = 0.07


    /**
     Filter(Smoothing) factor for pitch in range 0-1. It affects vertical movement of annotaion views. The lower the value the bigger the smoothing.
     Value of 1 means no smoothing, should be greater than 0. Default value is 0.05
     */
    pitchFilterFactor = 0.05

    //===== Internal variables
    /// Delegate
    delegate?: ARTrackingManagerDelegate
    locationManager = app.locationManager
    /// Tracking state.
    tracking = false
    /// Last detected user lotion
    userLocation?: Location
    currentAcceleration?: Acceleration
    /// Set automatically when heading changes. Also see filteredHeading.
    heading = 0
    /// Set in filterHeading. filterHeading must be called manually and often(display timer) bcs of filtering function.
    filteredHeading = 0
    /// Set in filterPitch. filterPitch must be called manually and often(display timer) bcs of filtering function.
    filteredPitch = 0
    /// If set, userLocation will return this value
    debugLocation?: Location
    /// If set, filteredHeading will return this value
    debugHeading?: number
    /// If set, filteredPitch will return this value
    debugPitch?: number

    /// Headings with greater headingAccuracy than this will be disregarded. In Degrees.
    minimumHeadingAccuracy = 120
    /// Return value for locationManagerShouldDisplayHeadingCalibration.
    // allowCompassCalibration = false
    /// Locations with greater horizontalAccuracy than this will be disregarded. In meters.
    minimumLocationHorizontalAccuracy = 500
    /// Locations older than this will be disregarded. In seconds.
    minimumLocationAge = 30

    //===== Private variables
    previousAcceleration: Acceleration
    reloadLocationPrevious?: Location
    reportLocationTimer?: NodeJS.Timer
    reportLocationDate?: number
    locationSearchTimer: NodeJS.Timer
    locationSearchStartTime: number
    catchupPitch = false
    headingStartDate: number
    // orientation: CLDeviceOrientation = CLDeviceOrientation.portrait
    // {
    //     didSet
    //     {
    //         this.locationManager.headingOrientation = this.orientation
    //     }
    // }

    watcherId: string
    constructor() {
        // super.init()
        this.initialize()
    }

    dealloc() {
        this.stopTracking()
        // NotificationCenter.default.removeObserver(self)
    }

    initialize() {
        // Defaults
        this.reloadDistanceFilter = 50
        this.userDistanceFilter = 15

        // Setup location manager
        // this.locationManager.desiredAccuracy = kLocationAccuracyBest
        // this.locationManager.distanceFilter = LocationDistance(this.userDistanceFilter)
        // this.locationManager.headingFilter = 1
        // this.locationManager.delegate = self

        // NotificationCenter.default.addObserver(self, selector: #selector(ARTrackingManager.deviceOrientationDidChange), name: NSNotification.Name.UIDeviceOrientationDidChange, object: nil)
        this.deviceOrientationDidChange()
    }

    deviceOrientationDidChange() {
        // if let deviceOrientation = CLDeviceOrientation(rawValue: Int32(UIDevice.current.orientation.rawValue))
        // {
        //     if deviceOrientation == .landscapeLeft || deviceOrientation == .landscapeRight || deviceOrientation == .portrait || deviceOrientation == .portraitUpsideDown
        //     {
        //         this.orientation = deviceOrientation
        //     }
        // }
    }

    //==========================================================================================================================================================
    // MARK:                                                        Tracking
    //==========================================================================================================================================================

    /**
     Starts location and motion manager
     
     - Parameter notifyFailure:     If true, will call arTrackingManager:didFailToFindLocationAfter: if location is not found.
     */
    locationWasStarted
    locationLevel
    startTracking(notifyLocationFailure = false) {
        this.resetAllTrackingData()

        // Location search
        if (notifyLocationFailure) {
            this.startLocationSearchTimer()

            // Calling delegate with value 0 to be flexible, for example user might want to show indicator when search is starting.
            this.delegate && this.delegate.didFailToFindLocationAfter(this, 0)
        }

        // Debug
        if (this.debugLocation) {
            this.userLocation = this.debugLocation;
        }

        // Start motion and location managers
        // this.locationManager.startUpdateHeading(1);
        this.locationWasStarted = this.locationManager.isStarted();
        this.locationLevel = this.locationManager.getLevel();
        this.watcherId = this.locationManager.watchPosition(this.onLocation);
        app.modules.motion.updateInterval = 50;
        this.locationManager.setLevelData({
            distanceFilter: 0,
            accuracy: Ti.Geolocation.ACCURACY_BEST
        });
        this.locationManager.start();
        // app.modules.motion.motionSensors = ['rotation'];
        app.modules.motion.on('orientation', this.onGyroscope)
        // app.modules.motion.on('accelerometer', this.onAcceleration)
        this.tracking = true
    }

    /// Stops location and motion manager
    stopTracking() {
        this.resetAllTrackingData()
        this.locationManager.setLevel(this.locationLevel);
        if (!this.locationWasStarted) {
            this.locationManager.stop();
        }
        this.locationManager.clearWatch(this.watcherId);
        this.watcherId = null;
        this.heading = undefined;
        // Stop motion and location managers
        app.modules.motion.off('orientation', this.onGyroscope)
        // app.modules.motion.off('accelerometer', this.onAcceleration)
        // this.locationManager.stopUpdateHeading()

        this.tracking = false
    }
    headingKF
    pitchKF
    /// Stops all timers and resets all data.
    resetAllTrackingData() {
        console.log('resetAllTrackingData');
        this.stopLocationSearchTimer()
        this.locationSearchStartTime = null

        this.stopReportLocationTimer()
        this.reportLocationDate = null
        //this.reloadLocationPrevious = nil // Leave it, bcs of reload
        this.previousAcceleration = { x: 0, y: 0, z: 0 }

        this.userLocation = null
        this.heading = 0
        this.filteredHeading = 0
        this.filteredPitch = 0
        this.headingKF = new KalmanFilter({R: 0.01, Q: 3});
        this.pitchKF = new KalmanFilter();
        // This will make filteredPitch catchup current pitch value on next heading calculation
        this.catchupPitch = true
        this.headingStartDate = null
    }

    //==========================================================================================================================================================
    // MARK:                                                        LocationManagerDelegate
    //==========================================================================================================================================================

    didUpdateHeading(newHeading: Heading) {
        if (newHeading.accuracy <= 0 || newHeading.accuracy > this.minimumHeadingAccuracy) {
            return
        }
        let previousHeading = this.heading

        // filteredHeading is not updated here bcs this is not called too often. filterHeading method should be called manually
        // with display timer.
        if (newHeading.trueHeading == undefined || newHeading.trueHeading < 0) {
            this.heading = normalizeDegree2(newHeading.magneticHeading % 360.0)
        }
        else {
            this.heading = normalizeDegree2(newHeading.trueHeading % 360.0)
        }
        /** 
         Handling unprecise readings, this whole section should prevent annotations from spinning because of
         unprecise readings & filtering. e.g. if first reading is 10° and second is 80°, due to filtering, annotations
         would move slowly from 10°-80°. So when we detect such situtation, we set _headingFilterFactor to 1, meaning that
         filtering is temporarily disabled and annotatoions will immediately jump to new heading.
         
         This is done only first 5 seconds after first heading.
        */

        // First heading after tracking started. Catching up filteredHeading.
        if (!this.headingStartDate) {
            this.headingStartDate = Date.now()
            this.filteredHeading = this.heading
        }

        // if (this.lastYaw !== undefined) {
        //     this.yawHeadingDelta = this.lastYaw;
        // }

        let headingStartDate = this.headingStartDate
        if (headingStartDate)// Always true
        {
            var recommendedHeadingFilterFactor = this.headingFilterFactor
            let headingFilteringStartTime = 5

            // First 5 seconds after first heading?
            if (headingStartDate > -headingFilteringStartTime) {
                // Disabling filtering if heading difference(current and previous) is > 10
                if (Math.abs(deltaAngle(this.heading, previousHeading)) > 10) {
                    recommendedHeadingFilterFactor = 1  // We could also just set this.filteredHeading = this.heading
                }
            }

            this._headingFilterFactor = recommendedHeadingFilterFactor
        }
        console.debug('didUpdateHeading', this.heading, previousHeading, this.filteredHeading, newHeading);
        this.filterHeading();
        this.delegate && this.delegate.didUpdateMotion(this, this.filteredPitch, this.filteredHeading)
    }
    onGyroscope = (e: GyroscopeEvent) => {
        const isLandscape = Titanium.Gesture.isLandscape();
        const yaw =(e.yaw);

    
        const pitch = (e.pitch);
        const roll = (e.roll);

        const normalizedPitch = normalizeDegree2(Math.round((-pitch - 90) * 1000) / 1000);
        const normalizedHeading = normalizeDegree2(Math.round((yaw) * 100) / 100);
        this.filteredHeading = this.headingKF.filter(normalizedHeading);
        this.filteredPitch = this.pitchKF.filter(normalizedPitch);


        // this.filteredPitch = normalizeDegree2(Math.round((-pitch - 90) * 1000) / 1000);

        // if (this.heading !== undefined) {
        //     const delta = yaw - this.yawHeadingDelta;
        //     this.filteredHeading = this.heading + delta;
        // } else {
        //     this.filteredHeading = yaw;
        // }
        // this.lastYaw = yaw;
        
        // console.debug('onGyroscope', yaw, pitch, roll, this.heading, this.yawHeadingDelta, this.filteredPitch);
        // const newPitch = normalizeDegree2(-90 - Math.round(pitch * 1000) / 1000);
        // const newHeading = normalizeDegree2(Math.round(e.yaw * 1000) / 1000 % 360.0);
        // if (newPitch === this.filteredPitch) {
        //     return;
        // }
        // this.didUpdateHeading({
        //     accuracy: 1,
        //     magneticHeading: heading
        // });
        this.delegate && this.delegate.didUpdateMotion(this, this.filteredPitch, this.filteredHeading, [yaw, pitch, roll])

    }
    onAcceleration = (e: AccelerometerEvent) => {
        // console.debug('onAcceleration', this.currentAcceleration, e.user);
        if (this.currentAcceleration && this.currentAcceleration.x === e.user.x
            && this.currentAcceleration.y === e.user.y
            && this.currentAcceleration.z === e.user.z) {
            return;
        }
        this.currentAcceleration = e.user;
        if (this.catchupPitch && (e.user.x != 0 || e.user.y != 0 || e.user.z != 0)) {
            this.previousAcceleration = e.user
            this.catchupPitch = false
        }
        // console.debug('onAcceleration', e.user, this.currentAcceleration, this.previousAcceleration, this.pitchFilterFactor);
        this.filterPitch();
        // this.delegate && this.delegate.didUpdatePitch(this, this.filteredPitch)

    }
    onLocation = (e: LocationEvent) => {


        //===== Disregarding old and low quality location detections
        const location = e.coords;
        let age = location.timestamp;


        if (e.heading) {
            this.didUpdateHeading(e.heading);
        // } else if (location.hasOwnProperty('heading')) {
        //     this.didUpdateHeading({
        //         accuracy:location.accuracy,
        //         magneticHeading:location.heading
        //     });
        }
        console.log('onLocation', location, e.heading, age);
        if (age < -this.minimumLocationAge || location.accuracy > this.minimumLocationHorizontalAccuracy || location.accuracy < 0) {
            console.debug(`Disregarding location: age: ${age}, ha: ${location.accuracy}`)
            return
        }
        // Location found, stop timer that is responsible for measuring how long location is not found.
        this.stopLocationSearchTimer()

        //===== Set current user location
        this.userLocation = location
        //this.userLocation = Location(coordinate: location.coordinate, altitude: 95, horizontalAccuracy: 0, verticalAccuracy: 0, timestamp: Date())

        if (this.debugLocation) { this.userLocation = this.debugLocation }


        // if (this.reloadLocationPrevious) { this.reloadLocationPrevious = this.userLocation }

        //@DEBUG
        /*if let location = this.userLocation
        {
            print("== \(location.horizontalAccuracy), \(age) \(location.coordinate.latitude), \(location.coordinate.longitude), \(location.altitude)" )
        }*/

        //===== Reporting location 5s after we get location, this will filter multiple locations calls and make only one delegate call
        let reportIsScheduled = !!this.reportLocationTimer

        // First time, reporting immediately
        if (!this.reportLocationDate) {
            this.reportLocationToDelegate()
        }
        // Report is already scheduled, doing nothing, it will report last location delivered in max 5s
        else if (reportIsScheduled) {

        }
        // Scheduling report in 5s
        else {
            this.startReportLocationTimer()
        }
    }

    stopReportLocationTimer() {
        if (this.reportLocationTimer) {
            clearTimeout(this.reportLocationTimer);
        }
        this.reportLocationTimer = null
    }

    startReportLocationTimer() {
        this.stopReportLocationTimer()
        this.reportLocationTimer = setTimeout(this.reportLocationToDelegate, 5000)
    }

    reportLocationToDelegate = () => {
        this.stopReportLocationTimer()
        this.reportLocationDate = Date.now()

        const userLocation = this.userLocation,
            reloadLocationPrevious = this.reloadLocationPrevious,
            reloadDistanceFilter = this.reloadDistanceFilter
        console.debug('reportLocationToDelegate', this.reportLocationDate, userLocation, reloadLocationPrevious, reloadDistanceFilter);
        if (!userLocation) {
            return;
        }

        const distance = reloadLocationPrevious ? app.utils.geolib.getPathLength([reloadLocationPrevious, userLocation]) : 0;
        console.debug('distance', distance);

        if (!reloadLocationPrevious || distance > reloadDistanceFilter) {
            this.reloadLocationPrevious = userLocation
            this.delegate && this.delegate.didUpdateReloadLocation(this, userLocation)
        }
        else {
            this.delegate && this.delegate.didUpdateUserLocation(this, userLocation)
        }
    }

    //==========================================================================================================================================================
    // MARK:                                                        Calculations
    //==========================================================================================================================================================

    /// Returns filtered(low-pass) pitch in degrees. -90(looking down), 0(looking straight), 90(looking up)
    filterPitch() {
        if (this.debugPitch) {
            return;
        }
        // let accelerometerData = this.motionManager.accelerometerData else { return }
        let acceleration = this.currentAcceleration;

        // Low-pass filter - filtering data so it is not jumping around
        let pitchFilterFactor = this.pitchFilterFactor
        this.previousAcceleration.x = (acceleration.x * pitchFilterFactor) + (this.previousAcceleration.x * (1.0 - pitchFilterFactor));
        this.previousAcceleration.y = (acceleration.y * pitchFilterFactor) + (this.previousAcceleration.y * (1.0 - pitchFilterFactor));
        this.previousAcceleration.z = (acceleration.z * pitchFilterFactor) + (this.previousAcceleration.z * (1.0 - pitchFilterFactor));

        let deviceOrientation = Titanium.Gesture.orientation
        var angle = 0
        switch (deviceOrientation) {
            case Ti.UI.PORTRAIT:
                {
                    angle = Math.atan2(this.previousAcceleration.y, this.previousAcceleration.z)
                    break;
                }
            case Ti.UI.UPSIDE_PORTRAIT:
                {
                    angle = Math.atan2(-this.previousAcceleration.y, this.previousAcceleration.z)
                    break;
                }
            case Ti.UI.LANDSCAPE_LEFT:
                {
                    angle = Math.atan2(this.previousAcceleration.x, this.previousAcceleration.z)
                    break;
                }
            case Ti.UI.LANDSCAPE_RIGHT:
                {
                    angle = Math.atan2(-this.previousAcceleration.x, this.previousAcceleration.z)
                    break;
                }
            default:
        }

        angle = radiansToDegrees(angle)
        angle += 90
        // Not really needed but, if pointing device down it will return 0...-30...-60...270...240 but like this it returns 0...-30...-60...-90...-120
        if (angle > 180) { angle -= 360 }

        // Even more filtering, not sure if really needed //@TODO
        this.filteredPitch = (this.filteredPitch + angle) / 2.0
    }


    filterHeading() {
        let headingFilterFactor = this._headingFilterFactor
        let previousFilteredHeading = this.filteredHeading
        let newHeading = this.debugHeading ? this.debugHeading : this.heading

        /*
         Low pass filter on heading cannot be done by using regular formula because our input(heading)
         is circular so we would have problems on heading passing North(0). Example:
         newHeading = 350
         previousHeading = 10
         headingFilterFactor = 0.5
         filteredHeading = 10 * 0.5 + 350 * 0.5 = 180 NOT OK - IT SHOULD BE 0
         
         First solution is to instead of passing 350 to the formula, we pass -10.
         Second solution is to not use 0-360 degrees but to express values with sine and cosine.
         */

        /*
         Second solution
         let newHeadingRad = degreesToRadians(newHeading)
         this.filteredHeadingSin = sin(newHeadingRad) * headingFilterFactor + this.filteredHeadingSin * (1 - headingFilterFactor)
         this.filteredHeadingCos = cos(newHeadingRad) * headingFilterFactor + this.filteredHeadingCos * (1 - headingFilterFactor)
         this.filteredHeading = radiansToDegrees(Math.atan2(this.filteredHeadingSin, this.filteredHeadingCos))
         this.filteredHeading = normalizeDegree(this.filteredHeading)
         */

        let newHeadingTransformed = newHeading
        if (Math.abs(newHeading - previousFilteredHeading) > 180) {
            if (previousFilteredHeading < 180 && newHeading > 180) {
                newHeadingTransformed -= 360
            }
            else if (previousFilteredHeading > 180 && newHeading < 180) {
                newHeadingTransformed += 360
            }
        }
        this.filteredHeading = (newHeadingTransformed * headingFilterFactor) + (previousFilteredHeading * (1.0 - headingFilterFactor))
        // console.debug('filterHeading', newHeading, newHeadingTransformed, headingFilterFactor, previousFilteredHeading, this.filteredHeading);
        this.filteredHeading = normalizeDegree2(newHeading)
    }

    catchupHeadingPitch() {
        this.catchupPitch = true
        this.filteredHeading = this.debugHeading ? this.debugHeading : this.heading
    }

    //@TODO rename to heading
    azimuthFromUserToLocation(userLocation: Location, location: Location, approximate = false) {
        var azimuth = 0

        if (approximate) {
            azimuth = this.approximateBearingBetween(userLocation, location)
        }
        else {
            azimuth = this.bearingBetween(userLocation, location)
        }

        return normalizeDegree2(azimuth);
    }

    /**
     Precise bearing between two points.
    */
    bearingBetween(startLocation: Location, endLocation: Location) {
        var azimuth = 0

        let lat1 = degreesToRadians(startLocation.latitude)
        let lon1 = degreesToRadians(startLocation.longitude)

        let lat2 = degreesToRadians(endLocation.latitude)
        let lon2 = degreesToRadians(endLocation.longitude)

        let dLon = lon2 - lon1

        let y = Math.sin(dLon) * Math.cos(lat2)
        let x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
        let radiansBearing = Math.atan2(y, x)
        azimuth = radiansToDegrees(radiansBearing)
        if (azimuth < 0) { azimuth += 360 }

        return azimuth
    }

    /**
     Approximate bearing between two points, good for small distances(<10km). 
     This is 30% faster than bearingBetween but it is not as precise. Error is about 1 degree on 10km, 5 degrees on 300km, depends on location...
     
     It uses formula for flat surface and multiplies it with LAT_LON_FACTOR which "simulates" earth curvature.
    */
    approximateBearingBetween(startLocation: Location, endLocation: Location) {
        var azimuth = 0

        let latitudeDistance = startLocation.latitude - endLocation.latitude;
        let longitudeDistance = startLocation.longitude - endLocation.longitude;

        azimuth = radiansToDegrees(Math.atan2(longitudeDistance, (latitudeDistance * LAT_LON_FACTOR)))
        azimuth += 180.0

        return azimuth
    }

    startDebugMode(location?: Location, heading?: number, pitch?: number) {
        if (location != undefined) {
            this.debugLocation = location
            this.userLocation = location
            this.reportLocationToDelegate();
        }

        if (heading != undefined) {
            this.debugHeading = heading
            this.heading = normalizeDegree2(heading % 360.0);
            this.filterHeading();
            //this.filteredHeading = heading    // Don't, it is different for heading bcs we are also simulating low pass filter
        }

        if (pitch != undefined) {
            this.debugPitch = pitch
            this.filteredPitch = pitch
        }
        this.delegate && this.delegate.didUpdateMotion(this, this.filteredPitch, this.filteredHeading, null)
        this.delegate && this.delegate.didUpdateUserLocation(this, this.userLocation)
    }

    stopDebugMode() {
        this.debugLocation = null
        this.userLocation = null
        this.debugHeading = null
        this.debugPitch = null
    }

    //==========================================================================================================================================================
    // MARK:                                                        Location search
    //==========================================================================================================================================================

    startLocationSearchTimer(resetStartTime: boolean = true) {
        this.stopLocationSearchTimer()

        if (resetStartTime) {
            this.locationSearchStartTime = Date.now()
        }
        this.locationSearchTimer = setTimeout(this.locationSearchTimerTick, 5000)
    }

    stopLocationSearchTimer(resetStartTime: boolean = true) {
        if (this.locationSearchTimer) {
            clearTimeout(this.locationSearchTimer);
        }
        this.locationSearchTimer = null
    }

    locationSearchTimerTick() {
        let locationSearchStartTime = this.locationSearchStartTime
        if (locationSearchStartTime) {
            return;
        }
        let elapsedSeconds = Date.now() - locationSearchStartTime

        this.startLocationSearchTimer(false)
        this.delegate && this.delegate.didFailToFindLocationAfter(this, elapsedSeconds)
    }
}

export class UiOptions {
    /// Enables/Disables debug map
    debugMap = false
    /// Enables/Disables debug sliders for heading/pitch and simulates userLocation to center of annotations
    simulatorDebugging = false
    /// Enables/Disables debug label at bottom and some indicator views when updating/reloading.
    debugLabel = false
    /// If true, it will set debugLocation to center of all annotations. Usefull for simulator debugging
    setUserLocationToCenterOfAnnotations = false;
    /// Enables/Disables close button.
    closeButtonEnabled = true
}


export class ArView extends View {
    // get bounds() {
    //     return { x: 0, y: 0, width: 0, height: 0 }
    // }
    // get frame() {
    //     return { x: 0, y: 0, width: 0, height: 0 }
    // }

    // set frame(value) {

    // }
    // get centerOffset() {
    //     return { x: 0, y: 0 }
    // }
    // get superview() {
    //     return null
    // }
    // insertSubview(view: ArView, index) { }
}

export class ARAnnotationView extends ArView {
    // arPosition?: { x: number, y: number }
    // arPositionOffset?: { x: number, y: number }
    // arAlternateFrame?: { x: number, y: number, width: number, height: number }
    // frame?: { x: number, y: number, width: number, height: number }
    annotation?: ARAnnotation
    // removeFromSuperview() {

    // }
    // bindUi() {

    // }

}


export interface ARAnnotation {
    [k: string]: any
    /// Identifier of annotation, not used by HDAugmentedReality internally.
    id: string

    /// Title of annotation, can be used in ARAnnotationView
    title?: string

    /// Location of the annotation, it is guaranteed to be valid location(coordinate). It is set in init or by validateAndSetLocation.
    location: Location

    /// View for annotation. It is set inside ARPresenter after fetching view from dataSource.
    annotationView?: ARAnnotationView

    // Internal use only, do not set this properties
    distanceFromUser?
    azimuth?
    pitch?
    active?

    /**
     Returns annotation if location(coordinate) is valid.
     */
    // constructor(identifier: string, title: string, location: Location) {
    //     this.identifier = identifier
    //     this.title = title
    //     this.location = location
    // }

    /// Validates location.coordinate and sets it.
    // validateAndSetLocation(location: Location) {
    //     this.location = location
    //     return true
    // }
}
// namespace ARConfiguration {

const LAT_LON_FACTOR = 1.33975031663                      // Used in azimuzh calculation, don't change
export function radiansToDegrees(radians: number) {
    return (radians) * (180.0 / Math.PI)
}

export function degreesToRadians(degrees: number) {
    return (degrees) * (Math.PI / 180.0)
}

/// Normalizes degree to 0-360
export function normalizeDegree(degree: number) {
    var degreeNormalized = degree % 360
    if (degreeNormalized < 0) {
        degreeNormalized = 360 + degreeNormalized
    }
    return degreeNormalized
}

/// Normalizes degree to -180....0....180
export function normalizeDegree2(degree: number) {
    var degreeNormalized = degree % 360
    if (degreeNormalized > 180) {
        degreeNormalized -= 360
    }
    else if (degreeNormalized < -180) {
        degreeNormalized += 360
    }

    return degreeNormalized
}

/// Finds shortes angle distance between two angles. Angles must be normalized(0-360)
export function deltaAngle(angle1: number, angle2: number) {
    var deltaAngle = angle1 - angle2

    if (deltaAngle > 180) {
        deltaAngle -= 360
    }
    else if (deltaAngle < -180) {
        deltaAngle += 360
    }
    return deltaAngle
}



/**
 Holds all location and device related information
 */
export class ARStatus {
    /// Horizontal field of view od device. Changes when device rotates(hFov becomes vFov).
    hFov: number = 0
    /// Vertical field of view od device. Changes when device rotates(vFov becomes hFov).
    vFov: number = 0
    /// How much pixels(logical) on screen is 1 degree, horizontally.
    hPixelsPerDegree: number = 0
    /// How much pixels(logical) on screen is 1 degree, vertically.
    vPixelsPerDegree: number = 0
    /// Heading of the device, 0-360.
    heading: number = 0
    filteredHeading: number = 0
    /// Pitch of the device, device pointing straight = 0, up(upper edge tilted toward user) = 90, down = -90.
    pitch: number = 0
    filteredPitch: number = 0
    /// Last known location of the user.
    userLocation?: Location

    orientation?: number[]

    /// True if all properties have been set.
    get ready(): boolean {
        let hFovOK = this.hFov > 0
        let vFovOK = this.vFov > 0
        let hPixelsPerDegreeOK = this.hPixelsPerDegree > 0
        let vPixelsPerDegreeOK = this.vPixelsPerDegree > 0
        let headingOK = !isNaN(this.heading) && this.heading != undefined
        let pitchOK = !isNaN(this.pitch) && this.pitch != undefined
        let userLocationOK = !!this.userLocation
        // console.log('ready', this);

        // return hFovOK && vFovOK && hPixelsPerDegreeOK && vPixelsPerDegreeOK && headingOK && pitchOK && userLocationOK
        return hFovOK && vFovOK && hPixelsPerDegreeOK && vPixelsPerDegreeOK && userLocationOK
    }
}
// }