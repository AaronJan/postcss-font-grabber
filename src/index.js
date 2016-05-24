/**
 * Postcss Font Grabber
 *
 * @license        Apache 2.0
 * @copyright  (c) 2016, AaronJan
 * @author         AaronJan <https://github.com/AaronJan/postcss-font-grabber>
 */

import postcss from 'postcss';
import FontGrabber from './lib/font-grabber';


//
// Make plugin instance.
//
const plugin = postcss.plugin('postcss-font-grabber', (opts) => {
  return FontGrabber.makePluginHandler(opts);
});

//
// Expose.
//
export default plugin;
