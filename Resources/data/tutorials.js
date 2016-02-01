exports.tutorials = {
    'locationbutton': {
        title: 'location_button',
        text: 'location_button_tutorial',
        radius: 35,
        anchor: 'bottomright',
        center: [36, 84]
    },
    'follow_heading': {
        title: 'follow_heading',
        text: 'follow_heading_tutorial',
        radius: 35,
        anchor: 'bottomright',
        center: [36, 84]
    },
    'marker_info_details': {
        title: 'item_details',
        text: 'item_details_tutorial',
        radius: 26,
        anchor: 'bottomright',
        center: [72, 84]
    },
    'marker_info_details2': {
        title: 'item_details',
        text: 'item_details2_tutorial',
        radius: 34,
        anchor: 'bottom',
        center: [0, 84]
    },
    'menu': {
        title: 'menu',
        text: 'menu_tutorial',
        radius: $nbButtonWidth / 2 + 10,
        anchor: 'topleft',
        center: [$nbButtonWidth / 2, $navBarTop + $navBarHeight / 2]
    },
    'offline_mode': {
        title: 'offline_mode',
        text: 'offline_mode_tutorial',
        radius: 40,
        anchor: 'bottomright',
        center: [-$leftMenuWidth + 30, ((app.info.deployType === 'development' && app.modules.plcrashreporter) ?
            3.5 : 2.5) * 50]
    },
    'map_settings': {
        title: 'map_settings',
        text: 'map_settings_tutorial',
        radius: $nbButtonWidth / 2 + 10,
        anchor: 'bottomleft',
        center: [$nbButtonWidth / 2, $nbButtonWidth / 2]
    },
    'gmaps_settings': {
        title: 'gmaps_settings',
        text: 'gmaps_settings_tutorial',
        radius: 30,
        anchor: 'bottomright',
        center: [Math.ceil(app.deviceinfo.width / 5 * 1.5), 27]
    },
    'custom_tilesource': {
        title: 'custom_map_source',
        text: 'custom_map_source_tutorial',
        radius: 30,
        anchor: 'bottomright',
        center: [Math.ceil(app.deviceinfo.width / 10), 27]
    },
    'tilesource_listview': {
        title: 'map_sources',
        text: 'map_sources_listview_tutorial',
        radius: 34,
        anchor: 'bottom',
        center: [0, $TSCountrolsHeight - 20]
    },
    'direction_listview': {
        title: 'initerary_points',
        text: 'direction_listview_tutorial',
        radius: 35,
        anchor: 'topleft',
        center: [90, $navBarTop + $navBarHeight + 20]
    },
    'direction_compute': {
        title: 'compute_initerary',
        text: 'compute_initerary_tutorial',
        radius: 20,
        anchor: 'topright',
        center: [0.5 * $nbButtonWidth, $navBarTop + $nbButtonWidth / 2]
    },
    'direction_select': {
        title: 'direction_select',
        text: 'direction_select_tutorial',
        radius: 34,
        anchor: 'center',
        center: [0, 0]
    },
    'direction_paintview': {
        title: 'direction_paint',
        text: 'direction_paint_tutorial',
        radius: 20,
        anchor: 'topleft',
        center: [1.5 * $nbButtonWidth, $navBarTop + $nbButtonWidth / 2]
    },
    'user_location': {
        title: 'user_location',
        text: 'user_location_tutorial',
        radius: 50,
        anchor: 'center',
        onMap: true,
        center: [0, -(2 * $navBarTop)]
    },
    'items_listview': {
        title: 'items_list',
        text: 'items_listview_tutorial',
        radius: 30,
        anchor: 'top',
        center: [0, $navBarTop + $navBarHeight + 50 + 40] //50 is for the ad
    },
    'item.firstchangemoved': {
        title: 'item_moved_on_update',
        text: 'item_moved_on_update_tutorial',
        radius: 50,
        anchor: 'top',
        center: [0, 0]
    },
    'position_share': {
        title: 'share_your_position',
        text: 'share_your_position_tutorial',
        radius: 30,
        anchor: 'top',
        center: [0, $navBarTop + $navBarHeight + 40]
    },
    'map_drop_pin': {
        title: 'adding_item',
        text: 'adding_item_tutorial',
        radius: 24,
        anchor: 'center',
        center: [0, 0]
    },
    'weather_route': {
        title: 'route_weather',
        text: 'route_weather_tutorial',
        radius: 0,
        anchor: 'center',
        center: [0, 100]
    },
    'action_bar_longpress': {
        title: 'long_press',
        text: 'action_bar_longpress_tutorial',
        radius: 30,
        anchor: 'bottom',
        center: [0, 30]
    }
};