<?php
/*
Plugin Name: Po-lazyload
Description: Adds filters and triggers to handle lazyloading on img, background-imgs and iframes
Version: 1.0.0
Author: Thibault Poisson
License: GPLv2 or later
Text Domain: po-lazyload
*/

define("PO_LAZYLOAD_PATH", plugin_dir_path(__FILE__));
define("PO_LAZYLOAD_URL", plugin_dir_url(__FILE__));

if (!function_exists('add_action')) {
    exit;
}

class PoLazyLoad
{
    private static $initiated = false;
    static $dummyImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    static $dummyIframe = 'about:blank';

    public static function init()
    {
        if (!self::$initiated) {
            self::init_hooks();
        }
    }

    private static function init_hooks()
    {
        add_filter('the_content', ["PoLazyLoad", 'replaceBGImageByLazyStyle'], 10, 1);
        add_filter('the_content', ["PoLazyLoad", 'replaceSRC'], 10, 1);

        add_action('wp_enqueue_scripts', ["PoLazyLoad", 'enqueue']);

        add_filter('plugin_action_links_astera-lazyload/astera-lazyload.php', ["PoLazyLoad", "linkInPluginsList"]);
        add_action("wp_ajax_lazyloadWriteOptions", ["PoLazyLoad", "writeOptions"]);
        if (is_admin()) {
            add_action('admin_menu', ["PoLazyLoad", 'adminPage']);
            add_action('admin_init', ["PoLazyLoad", 'registerSettings']);
        }
    }

    static function writeOptions()
    {
        echo 'writeOptions ';
        foreach ($_REQUEST as $item => $value) {
            if (strpos($item, "lazyload_") !== false) {
                echo "\n\r$item new value is: '$value'";
                update_option($item, $value, 1);
            }
        }
        die();
    }

    static function registerSettings()
    {
    }

    static function adminPage()
    {
        add_options_page("Lazyload options", "Lazyload options", "administrator", "lazyload", function () {
            include(PO_LAZYLOAD_PATH . '/templates/adminPage.php');
        });
    }

    static function linkInPluginsList($links)
    {
        array_push(
            $links,
            "<a href='" . get_bloginfo("url") . "/wp-admin/options-general.php?page=lazyload'>Settings</a>"
        );
        return $links;
    }

    static function enqueue()
    {
        wp_enqueue_script('lazyload', PO_LAZYLOAD_URL . "/lazyload.js", ["jquery"], "1", true);
    }

    static function replaceBGImageByLazyStyle($content)
    {
        if (get_option("lazyload_bg", '0')) {
            // Define the regex pattern to match style attributes containing background-image
            $pattern = '/(<div[^>]*style\s*=\s*["\']([^"\']*\bbackground-image[^"\']*)["\'][^>]*>)/i';

            // Use preg_replace_callback to perform the replacement
            $content = preg_replace_callback($pattern, function ($matches) {
                return str_replace('style=', 'data-lazy-style=', $matches[1]);
            }, $content);
        }
        return $content;
    }

    static function replaceSRC($content)
    {
        $onImg = get_option("lazyload_img", 0);
        $onIframe = get_option("lazyload_iframe", 0);
        if ($onImg || $onIframe) {
            // Define the regex patterns to match img and iframe tags without the no-lazy class
            $patternImg =  '/<img(?![^>]*class\s*=\s*["\'][^"\']*\bno-lazy\b[^"\']*["\'])[^>]*src\s*=\s*["\']([^"\']*)["\']([^>]*)>/i';
            $patternIframe =  '/<img(?![^>]*class\s*=\s*["\'][^"\']*\bno-lazy\b[^"\']*["\'])[^>]*src\s*=\s*["\']([^"\']*)["\']([^>]*)>/i';

            $patterns = [];
            if ($onImg) {
                $patterns[] = $patternImg;
            }
            if ($onIframe) {
                $patterns[] = $patternIframe;
            }

            // Replacement function for both patterns
            $callback = function ($matches) {
                // is the tag is img or iframe ?
                $isImg = stripos($matches[0], '<img') !== false;
                $originalSrc = $matches[1];
                $dummySrc = static::$dummyImg;
                if (!$isImg) {
                    $dummySrc = static::$dummyIframe;
                }

                // Full match of the tag and its attributes
                $tagBefore = $matches[0];

                // Create the new tag with data-lazy-src and dummy src
                $tag_after = str_replace(
                    $originalSrc,
                    $dummySrc,
                    $tagBefore
                );

                // Add data-lazy-src attribute
                $tag_after = str_replace(
                    'src=',
                    'data-lazy-src="' . esc_attr($originalSrc) . '" src=',
                    $tag_after
                );

                return $tag_after;
            };

            foreach ($patterns as $pattern) {
                $content = preg_replace_callback($pattern, $callback, $content);
            }
        }

        return $content;
    }
}


PoLazyload::init();