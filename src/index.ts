/**
 * Postcss Font Grabber
 *
 * @license        Apache 2.0
 * @copyright  (c) 2018, AaronJan
 * @author         AaronJan <https://github.com/AaronJan/postcss-font-grabber>
 */

import postcss from 'postcss';
import { PluginOptions } from './contracts';
import { FontGrabber } from './font-grabber';
import { parseOptions } from './font-grabber/functions';

/**
 * 
 * @param options 
 */
function makeInstance(options: PluginOptions | undefined): FontGrabber {
    if (options === undefined) {
        throw new Error(`You must specify plugin options.`);
    }

    return new FontGrabber(parseOptions(options));
}

/**
 * 
 */
const plugin = postcss.plugin<PluginOptions>('postcss-font-grabber', options => {
    return makeInstance(options).makeTransformer();
});

export {
    makeInstance,
    plugin as postcssFontGrabber,
};

export default plugin;


