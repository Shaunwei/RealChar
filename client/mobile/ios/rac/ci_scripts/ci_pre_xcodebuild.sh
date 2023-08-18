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

    PROJECT_PATH=$CI_WORKSPACE/client/mobile/ios/rac

    BETA_ICON_PATH=$PROJECT_PATH/ci_scripts/AppIcon-Beta.appiconset
    APP_ICON_PATH=$PROJECT_PATH/rac/Assets/Assets.xcassets/AppIcon.appiconset

    # Remove existing App Icon
    rm -rf $APP_ICON_PATH

    # Replace with Fruta Beta App Icon
    mv $BETA_ICON_PATH $APP_ICON_PATH

    ls $PROJECT_PATH/rac/Info.plist

    plutil -replace RCServerUrl -string $SERVER_URL $PROJECT_PATH/rac/Info.plist
    plutil -replace RCWebUrl -string $WEB_URL $PROJECT_PATH/rac/Info.plist

    plutil -p $PROJECT_PATH/rac/Info.plist
fi
