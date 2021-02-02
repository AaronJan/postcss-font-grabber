/**
 * Postcss Font Grabber
 *
 * @license    Apache 2.0
 * @copyright  2021, AaronJan
 * @author     AaronJan <https://github.com/AaronJan/postcss-font-grabber>
 */

import { PluginCreator } from 'postcss';
import { PluginOptions } from './types';
import { FontGrabber } from './font-grabber';

const postcssFontGrabber: PluginCreator<PluginOptions> = (
  options: PluginOptions = {},
) => {
  const fontGrabber = new FontGrabber(options);
  return fontGrabber.createPlugin();
};
postcssFontGrabber.postcss = true;

export { postcssFontGrabber };
export default postcssFontGrabber;
