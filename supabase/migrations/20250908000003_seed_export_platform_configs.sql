-- Migration: Seed Export Platform Configurations
-- Description: Default platform configurations for game exports
-- Date: 2025-09-08

-- Web Platform Configurations
INSERT INTO export_platform_configs (platform, config_name, config_data, is_default, required_tier, optimization_settings, build_commands) VALUES
('web', 'Standard Web Export', '{
    "bundle_type": "html5",
    "minify": true,
    "include_source_maps": false,
    "compression": "gzip",
    "target_browsers": ["chrome >= 90", "firefox >= 88", "safari >= 14", "edge >= 90"],
    "features": {
        "offline_support": false,
        "responsive_design": true,
        "touch_optimized": true,
        "gamepad_support": true
    }
}', true, 'free', '{
    "image_optimization": true,
    "audio_compression": true,
    "code_splitting": false,
    "tree_shaking": true
}', '["npm run build:web", "npm run optimize:assets"]'),

('pwa', 'Progressive Web App', '{
    "bundle_type": "pwa",
    "minify": true,
    "include_source_maps": false,
    "compression": "brotli",
    "target_browsers": ["chrome >= 90", "firefox >= 88", "safari >= 14", "edge >= 90"],
    "features": {
        "offline_support": true,
        "push_notifications": false,
        "install_prompt": true,
        "responsive_design": true,
        "touch_optimized": true,
        "gamepad_support": true,
        "service_worker": true
    },
    "manifest": {
        "theme_color": "#1a1a1a",
        "background_color": "#ffffff",
        "display": "fullscreen",
        "orientation": "any"
    }
}', true, 'free', '{
    "image_optimization": true,
    "audio_compression": true,
    "code_splitting": true,
    "tree_shaking": true,
    "caching_strategy": "cache_first"
}', '["npm run build:pwa", "npm run generate:manifest", "npm run optimize:assets"]');

-- Desktop Platform Configurations
INSERT INTO export_platform_configs (platform, config_name, config_data, is_default, required_tier, optimization_settings, build_commands) VALUES
('desktop-windows', 'Windows Desktop', '{
    "bundle_type": "electron",
    "target_arch": ["x64", "arm64"],
    "compression": true,
    "auto_updater": false,
    "features": {
        "native_menus": true,
        "system_tray": false,
        "file_associations": true,
        "startup_launch": false,
        "fullscreen_mode": true
    },
    "executable": {
        "icon": "icon.ico",
        "company_name": "GameGen",
        "file_description": "GameGen Exported Game",
        "product_name": "${GAME_TITLE}"
    }
}', true, 'pro', '{
    "native_modules": true,
    "code_signing": false,
    "installer_creation": true,
    "bundle_size_optimization": true
}', '["npm run build:desktop", "electron-builder --win"]'),

('desktop-macos', 'macOS Desktop', '{
    "bundle_type": "electron",
    "target_arch": ["x64", "arm64"],
    "compression": true,
    "auto_updater": false,
    "features": {
        "native_menus": true,
        "dock_integration": true,
        "file_associations": true,
        "launch_services": true,
        "fullscreen_mode": true
    },
    "executable": {
        "icon": "icon.icns",
        "bundle_id": "com.gamegen.exported.${GAME_ID}",
        "category": "public.app-category.games",
        "copyright": "© 2025 GameGen"
    }
}', true, 'pro', '{
    "native_modules": true,
    "code_signing": false,
    "notarization": false,
    "bundle_size_optimization": true
}', '["npm run build:desktop", "electron-builder --mac"]'),

('desktop-linux', 'Linux Desktop', '{
    "bundle_type": "electron",
    "target_arch": ["x64", "arm64"],
    "compression": true,
    "auto_updater": false,
    "features": {
        "native_menus": true,
        "system_integration": true,
        "file_associations": true,
        "desktop_entry": true,
        "fullscreen_mode": true
    },
    "executable": {
        "icon": "icon.png",
        "desktop_name": "${GAME_TITLE}",
        "generic_name": "Game",
        "categories": ["Game", "ArcadeGame"]
    }
}', true, 'pro', '{
    "native_modules": true,
    "appimage_creation": true,
    "deb_package": true,
    "bundle_size_optimization": true
}', '["npm run build:desktop", "electron-builder --linux"]');

-- Mobile Platform Configurations
INSERT INTO export_platform_configs (platform, config_name, config_data, is_default, required_tier, optimization_settings, build_commands) VALUES
('mobile-android', 'Android APK', '{
    "bundle_type": "cordova",
    "min_sdk_version": 23,
    "target_sdk_version": 34,
    "features": {
        "hardware_acceleration": true,
        "immersive_mode": true,
        "orientation_lock": false,
        "keep_screen_on": true,
        "volume_controls": true
    },
    "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.WAKE_LOCK"
    ],
    "app_info": {
        "version_code": 1,
        "package_name": "com.gamegen.exported.${GAME_ID}",
        "app_name": "${GAME_TITLE}",
        "theme": "@android:style/Theme.NoTitleBar.Fullscreen"
    }
}', true, 'pro', '{
    "apk_optimization": true,
    "proguard_enabled": true,
    "resource_optimization": true,
    "native_libs_optimization": true
}', '["cordova platform add android", "cordova build android --release"]'),

('mobile-ios', 'iOS App', '{
    "bundle_type": "cordova",
    "deployment_target": "12.0",
    "features": {
        "hardware_acceleration": true,
        "status_bar_hidden": true,
        "orientation_lock": false,
        "disable_cursor": true,
        "webview_bounce": false
    },
    "app_info": {
        "bundle_version": "1.0.0",
        "bundle_identifier": "com.gamegen.exported.${GAME_ID}",
        "app_name": "${GAME_TITLE}",
        "requires_fullscreen": true
    },
    "plist_entries": {
        "UIRequiresFullScreen": true,
        "UIStatusBarHidden": true,
        "UIViewControllerBasedStatusBarAppearance": false
    }
}', true, 'pro', '{
    "ipa_optimization": true,
    "bitcode_enabled": false,
    "resource_optimization": true,
    "symbol_stripping": true
}', '["cordova platform add ios", "cordova build ios --release"]');

-- Source Code Export Configuration
INSERT INTO export_platform_configs (platform, config_name, config_data, is_default, required_tier, optimization_settings, build_commands) VALUES
('source-code', 'Complete Source Export', '{
    "bundle_type": "source",
    "include_assets": true,
    "include_dependencies": true,
    "documentation_level": "detailed",
    "features": {
        "build_scripts": true,
        "development_setup": true,
        "deployment_guides": true,
        "api_documentation": true,
        "code_comments": true
    },
    "structure": {
        "src_directory": "src",
        "assets_directory": "assets",
        "docs_directory": "docs",
        "tests_directory": "tests",
        "config_files": true
    }
}', true, 'pro', '{
    "code_formatting": true,
    "comment_generation": true,
    "documentation_generation": true,
    "example_generation": true
}', '["npm run build:source", "npm run generate:docs", "npm run package:source"]');

-- Premium configurations for Max tier users
INSERT INTO export_platform_configs (platform, config_name, config_data, is_default, required_tier, optimization_settings, build_commands) VALUES
('web', 'White-label Web Export', '{
    "bundle_type": "html5",
    "minify": true,
    "include_source_maps": false,
    "compression": "brotli",
    "white_label": true,
    "custom_branding": {
        "remove_gamegen_branding": true,
        "custom_splash_screen": true,
        "custom_loading_screen": true,
        "custom_favicon": true,
        "custom_meta_tags": true
    },
    "advanced_features": {
        "analytics_integration": true,
        "custom_domain_ready": true,
        "seo_optimization": true,
        "social_media_optimization": true
    }
}', false, 'max', '{
    "advanced_optimization": true,
    "custom_cdn_integration": true,
    "performance_monitoring": true,
    "a_b_testing_ready": true
}', '["npm run build:web:premium", "npm run optimize:premium", "npm run seo:generate"]'),

('desktop-windows', 'Enterprise Windows', '{
    "bundle_type": "electron",
    "target_arch": ["x64", "arm64"],
    "compression": true,
    "auto_updater": true,
    "white_label": true,
    "enterprise_features": {
        "msi_installer": true,
        "group_policy_support": true,
        "corporate_certificates": true,
        "custom_branding": true,
        "silent_installation": true
    }
}', false, 'max', '{
    "enterprise_optimization": true,
    "code_signing": true,
    "advanced_security": true,
    "performance_profiling": true
}', '["npm run build:desktop:enterprise", "electron-builder --win --publish=never"]');

-- Initialize queue stats
INSERT INTO export_queue_stats (stats_date, total_queued, total_processing, active_workers, max_workers)
VALUES (CURRENT_DATE, 0, 0, 0, 5);

-- Add comments
COMMENT ON TABLE export_platform_configs IS 'Platform-specific export configurations with subscription tier access control';