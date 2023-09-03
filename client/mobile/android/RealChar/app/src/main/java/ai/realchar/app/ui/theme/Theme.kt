/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.ui.theme

import ai.realchar.app.R
import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = RealContrastBlue,
    inversePrimary = Color.White,
    secondary = PurpleGrey80,
    onPrimary = RealOrange500,
    surface = Color.White,
    tertiary = Tertiary,

    background = Color.Black,
    secondaryContainer = DarkSecondaryBackGround
)

private val LightColorScheme = lightColorScheme(
    primary = RealBlack,
    inversePrimary = Color.White,
    secondary = PurpleGrey40,
    surface = LightForeGround,
    onPrimary = RealOrange500,
    tertiary = Tertiary,

    background = Color.White,
    secondaryContainer = LightSecondaryBackGround
    /* Other default colors to override
    background = Color(0xFFFFFBFE),
    surface = Color(0xFFFFFBFE),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Color(0xFF1C1B1F),
    onSurface = Color(0xFF1C1B1F),
    */
)

@Composable
fun RealCharTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.tertiary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }
    CompositionLocalProvider(
        LocalRealCharThemedAssets provides if (darkTheme) RealCharThemedAssets.Dark else RealCharThemedAssets.Light,
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = buildTypography(colorScheme),
            content = content
        )}

}

val MaterialTheme.assets
    @Composable
    @ReadOnlyComposable
    get() = LocalRealCharThemedAssets.current

open class RealCharThemedAssets private constructor(
    val logo: Int
) {
    object Light : RealCharThemedAssets(
        logo = R.drawable.ic_logo
    )

    object Dark : RealCharThemedAssets(
        logo = R.drawable.ic_logo_dark
    )
}

internal var LocalRealCharThemedAssets = staticCompositionLocalOf {
    RealCharThemedAssets.Light as RealCharThemedAssets
}
