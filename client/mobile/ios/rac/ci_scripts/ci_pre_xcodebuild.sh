#!/bin/sh

#  ci_pre_xcodebuild.sh
#  rac
#
#  Created by ZongZiWang on 8/16/23.
#

if [[ -n $CI_PULL_REQUEST_NUMBER && $CI_XCODEBUILD_ACTION = 'archive' ]];
then
    echo "Setting Fruta Beta App Icon"
    echo "CI_PULL_REQUEST_NUMBER is $CI_PULL_REQUEST_NUMBER"
    echo "CI_WORKSPACE is $CI_WORKSPACE"

    APP_ICON_PATH=$CI_WORKSPACE/client/mobile/ios/rac/rac/Assets/Assets.xcassets/AppIcon.appiconset

    # Remove existing App Icon
    rm -rf $APP_ICON_PATH

    # Replace with Fruta Beta App Icon
    mv "$CI_WORKSPACE/ci_scripts/AppIcon-Beta.appiconset" $APP_ICON_PATH
fi
