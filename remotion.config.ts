/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

// the console uses @remotion/effects (WebGL2) for the dissolve, the scanlines
// and the projection, so the renderer has to be told to use ANGLE
Config.setChromiumOpenGlRenderer("angle");
Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
