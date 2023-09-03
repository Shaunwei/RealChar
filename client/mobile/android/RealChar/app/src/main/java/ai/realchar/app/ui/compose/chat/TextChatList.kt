package ai.realchar.app.ui.compose.chat

import ai.realchar.app.R
import ai.realchar.app.ui.compose.CharacterMessage
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@Composable
fun TextChatList(modifier: Modifier = Modifier) {
    Box(modifier = modifier) {
        LazyColumn(
            modifier = Modifier
                .padding(horizontal = 48.dp)
        ) {
            items(2) {
                CharacterMessage(text = "Do not go gentle into that good night,\n" +
                        "Old age should burn and rave at close of day;\n" +
                        "Rage, rage against the dying of the light.\n" +
                        "Though wise men at their end know dark is right")
            }
            item {
                MyMessage(text = "Because their words had forked no lightning they\n" +
                        "Do not go gentle into that good night.\n" +
                        "Good men, the last wave by, crying how bright.")
            }
            item {
                MyMessageInput()
            }
        }
    }

}


private val MY_MESSAGE_CORNER_RADIUS = 8.dp

private fun myMessageModifier(colorScheme: ColorScheme): Modifier {
    return Modifier
        .padding(12.dp)
        .background(
            color = colorScheme.secondaryContainer,
            shape = RoundedCornerShape(
                MY_MESSAGE_CORNER_RADIUS,
                MY_MESSAGE_CORNER_RADIUS,
                0.dp,
                MY_MESSAGE_CORNER_RADIUS
            )
        )
        .padding(12.dp)
}

@Composable
fun MyMessage(text: String) {
    Text(
        modifier = myMessageModifier(MaterialTheme.colorScheme),
        text = text,
        style = MaterialTheme.typography.bodyMedium
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyMessageInput() {
    var txt by remember {
        mutableStateOf("")
    }
    TextField(
        modifier = myMessageModifier(MaterialTheme.colorScheme).padding(0.dp),
        value = txt,
        placeholder = {
            Text(
                text = stringResource(id = R.string.your_turn),
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = MaterialTheme.colorScheme.tertiary
                )
            )
        },
        textStyle = MaterialTheme.typography.bodyMedium.copy(textAlign = TextAlign.End),
        onValueChange = { txt = it },
        colors = TextFieldDefaults.textFieldColors(
            textColor = MaterialTheme.colorScheme.surface,
            containerColor = Color.Transparent,
            focusedIndicatorColor = Color.Transparent,
            unfocusedIndicatorColor = Color.Transparent,
            cursorColor = MaterialTheme.colorScheme.surface
        )
    )
}
