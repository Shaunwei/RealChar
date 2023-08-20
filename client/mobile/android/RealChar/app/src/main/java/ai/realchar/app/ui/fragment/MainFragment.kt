/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.ui.fragment

import ai.realchar.app.R
import ai.realchar.app.ui.compose.AboutPage
import ai.realchar.app.ui.compose.SettingsPage
import ai.realchar.app.ui.compose.TryOutPage
import ai.realchar.app.ui.compose.modifier.coloredUnderline
import ai.realchar.app.ui.theme.RealCharTheme
import ai.realchar.app.ui.theme.assets
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.fragment.app.Fragment
import androidx.viewpager2.widget.ViewPager2
import kotlinx.coroutines.launch

class MainFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ) = ComposeView(requireContext()).apply {
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            Main()
        }

    }


}

@Composable
fun Main() {
    RealCharTheme {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            Image(
                painter = rememberVectorPainter(image = ImageVector.vectorResource(id = MaterialTheme.assets.logo)),
                contentDescription = null,
                modifier = Modifier
                    .padding(top = 60.dp, start = 32.dp, bottom = 30.dp)
                    .height(32.dp)
            )
            TabArea()
        }
    }
}


private enum class Tab(val resId: Int) {
    ABOUT(R.string.tab_about),
    TRY_OUT(R.string.tab_try_out),
    SETTINGS(R.string.tab_settings),
}

@Composable
private fun TabArea() {
    var currentTab by remember { mutableStateOf(Tab.ABOUT) }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp)
    ) {
        Row(
            modifier = Modifier.padding(bottom = 40.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            TabTitle(tab = Tab.ABOUT, currentTab = currentTab) {
                currentTab = Tab.ABOUT
            }
            TabTitle(tab = Tab.TRY_OUT, currentTab = currentTab) {
                currentTab = Tab.TRY_OUT
            }
            TabTitle(tab = Tab.SETTINGS, currentTab = currentTab) {
                currentTab = Tab.SETTINGS
            }
        }

        when (currentTab) {
            Tab.ABOUT -> AboutPage()
            Tab.TRY_OUT -> TryOutPage()
            else -> SettingsPage()
        }
    }
}

@Composable
private fun TabTitle(tab: Tab, currentTab: Tab, onClick: () -> Unit) {
    Text(
        text = stringResource(id = tab.resId),
        modifier = Modifier.padding(end = 16.dp)
            .wrapContentWidth()
            .wrapContentHeight()
            .padding(vertical = 8.dp)
            .clickable(onClick = onClick)
            .then(
                if (tab == currentTab) Modifier.coloredUnderline(
                    color = MaterialTheme.colorScheme.tertiary
                ) else Modifier
            ),
        style = LocalTextStyle.current.copy(
            color = MaterialTheme.colorScheme.surface
        )
    )
}

@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    Main()
}