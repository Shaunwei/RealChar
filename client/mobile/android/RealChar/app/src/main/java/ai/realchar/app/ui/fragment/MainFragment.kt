/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.ui.fragment

import ai.realchar.app.R
import ai.realchar.app.ui.compose.AboutPage
import ai.realchar.app.ui.compose.ChatPage
import ai.realchar.app.ui.compose.ROUTE_CHAT
import ai.realchar.app.ui.compose.SettingsPage
import ai.realchar.app.ui.compose.TryOutPage
import ai.realchar.app.ui.compose.modifier.coloredUnderline
import ai.realchar.app.ui.compose.widgets.VectorImage
import ai.realchar.app.ui.theme.RealCharTheme
import ai.realchar.app.ui.theme.assets
import ai.realchar.app.ui.vm.CharactersModel
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.fragment.app.Fragment
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument

const val ROUTE_MAIN = "home"

class MainFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ) = ComposeView(requireContext()).apply {
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            val navController = rememberNavController()
            val charactersModel: CharactersModel = viewModel()
            NavHost(navController = navController, startDestination = ROUTE_MAIN) {
                composable(ROUTE_MAIN) {
                    Main(charactersModel, navController)
                }

                composable("$ROUTE_CHAT/{char_id}", arguments = listOf(
                    navArgument("char_id") {
                        type = NavType.StringType
                    }
                )) { backStackEntry ->
                    var charId = backStackEntry.arguments?.getString("char_id")
                    val character = charactersModel.characters.value?.firstOrNull {
                        it.id == charId
                    } ?: throw IllegalArgumentException()
                    ChatPage(character, navController)
                }
            }

        }


    }
}

@Composable
fun Main(
    charactersModel: CharactersModel = viewModel(),
    navController: NavHostController = rememberNavController(),
) {

    RealCharTheme {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            VectorImage(
                modifier = Modifier
                    .padding(top = 60.dp, start = 32.dp, bottom = 30.dp)
                    .height(32.dp),
                resId = MaterialTheme.assets.logo
            )
            TabArea(charactersModel = charactersModel, navController)
        }
    }
}


private enum class Tab(val resId: Int) {
    ABOUT(R.string.tab_about),
    TRY_OUT(R.string.tab_try_out),
    SETTINGS(R.string.tab_settings),
}

@Composable
private fun TabArea(
    charactersModel: CharactersModel = viewModel(),
    navController: NavHostController = rememberNavController(),
) {
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
            Tab.TRY_OUT -> TryOutPage(viewModel = charactersModel, navController = navController)
            else -> SettingsPage()
        }
    }
}

@Composable
private fun TabTitle(tab: Tab, currentTab: Tab, onClick: () -> Unit) {
    Text(
        text = stringResource(id = tab.resId),
        modifier = Modifier
            .padding(end = 16.dp)
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