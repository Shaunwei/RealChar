package ai.realchar.app.ui.compose

import ai.realchar.app.R
import ai.realchar.app.model.Character
import ai.realchar.app.ui.compose.chat.TextChatList
import ai.realchar.app.ui.compose.chat.VoiceChat
import ai.realchar.app.ui.compose.widgets.CircleButton
import ai.realchar.app.ui.compose.widgets.VectorImage
import ai.realchar.app.ui.fragment.ROUTE_MAIN
import ai.realchar.app.ui.theme.RealCharTheme
import ai.realchar.app.ui.theme.RealOrange700
import ai.realchar.app.ui.theme.assets
import ai.realchar.app.ui.vm.CharactersModel
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldColors
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.constraintlayout.compose.ConstraintLayout
import androidx.constraintlayout.compose.Dimension
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navOptions

const val ROUTE_CHAT = "chat"

@Composable
fun ChatPage(
    character: Character,
    navController: NavController = rememberNavController()
) {

    var mode by remember {
        mutableStateOf(ChatMode.TEXT)
    }
    RealCharTheme(darkTheme = true) {
        Column(
            modifier = Modifier
                .navigationBarsPadding()
                .imePadding()
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)

        ) {
            NavBar(navController)
            when (mode) {
                ChatMode.TEXT -> TextChatList(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1.0f)
                )

                ChatMode.VOICE -> VoiceChat(modifier = Modifier
                    .fillMaxWidth()
                    .weight(1.0f))
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(
                    28.dp,
                    alignment = Alignment.CenterHorizontally
                )
            ) {
                CircleButton(
                    backgroundColor = MaterialTheme.colorScheme.onPrimary,
                    strokeColor = MaterialTheme.colorScheme.surface,
                    onClick = { navigateToHome(navController) }) {
                    VectorImage(modifier = Modifier.size(24.dp), resId = R.drawable.ic_power)
                }

                CircleButton(
                    backgroundColor = MaterialTheme.colorScheme.secondaryContainer,
                    onClick = { mode = if (mode == ChatMode.TEXT) ChatMode.VOICE else ChatMode.TEXT }) {
                    VectorImage(modifier = Modifier.size(24.dp), resId = R.drawable.ic_message)
                }
            }


        }
    }
}

private enum class ChatMode{
    TEXT,
    VOICE,
}

@Composable
fun NavBar(navController: NavController = rememberNavController()) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp, horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        VectorImage(
            modifier = Modifier
                .size(52.dp)
                .padding(12.dp)
                .clickable {
                },
            resId = R.drawable.ic_share
        )
        VectorImage(
            modifier = Modifier.height(32.dp),
            resId = MaterialTheme.assets.logo
        )
        VectorImage(
            modifier = Modifier
                .size(52.dp)
                .padding(12.dp)
                .clickable {
                    navigateToHome(navController)
                },
            resId = R.drawable.ic_menu
        )

    }
}

@Composable
fun CharacterMessage(text: String) {
    Text(
        modifier = Modifier.padding(12.dp),
        text = text,
        style = MaterialTheme.typography.bodyMedium
    )
}


private fun navigateToHome(navController: NavController) {
    navController.popBackStack(ROUTE_MAIN, false)
}
