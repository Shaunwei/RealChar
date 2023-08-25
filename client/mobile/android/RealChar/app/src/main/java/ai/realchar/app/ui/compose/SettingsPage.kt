/**
 * Created by obesitychow on 8/17/23
 */

package ai.realchar.app.ui.compose

import ai.realchar.app.R
import ai.realchar.app.model.ILlmOption
import ai.realchar.app.model.LlmOption
import ai.realchar.app.model.LoginUser
import ai.realchar.app.model.User
import ai.realchar.app.ui.compose.widgets.RoundedButton
import ai.realchar.app.ui.compose.widgets.SectionHeader
import ai.realchar.app.ui.compose.widgets.VectorImage
import ai.realchar.app.ui.compose.widgets.borderStyle
import ai.realchar.app.ui.vm.GlobalVM
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.constraintlayout.compose.ConstraintLayout
import androidx.constraintlayout.compose.Dimension

@Composable
fun SettingsPage() {
    Column {
        ScrollableContent(modifier = Modifier
            .padding(bottom = 8.dp)
            .fillMaxWidth()
            .weight(1.0f))

        Row(
            modifier = Modifier
                .padding(bottom = 10.dp)
                .border(
                    width = 2.dp,
                    color = Color(0xFFA7BFFF),
                    shape = RoundedCornerShape(size = 4.dp)
                )
                .fillMaxWidth()
                .height(52.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(id = R.string.leave_feedback),
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
fun ScrollableContent(modifier: Modifier) {
    val loginUser: LoginUser? by GlobalVM.loginUser.observeAsState()
    val llmModel: ILlmOption? by GlobalVM.model.observeAsState()
    val enableSearch: Boolean? by GlobalVM.enableSearch.observeAsState()
    val hapticFeedBack: Boolean? by GlobalVM.hapticFeedBack.observeAsState()
    val enableSecondBrain: Boolean? by GlobalVM.enableSecondBrain.observeAsState()

    Column(
        modifier = modifier.verticalScroll(rememberScrollState())
    ) {
        // User section
        Column {
            SectionHeader(R.string.user_settings)
            loginUser?.let {
                UserInfo(loginUser = it)
                Text(text = stringResource(id = R.string.log_out),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = MaterialTheme.colorScheme.onPrimary
                    ),
                    modifier = Modifier.clickable {
                        GlobalVM.logout()
                    })
            } ?: LoginEntries()
        }

        Column(modifier = Modifier.padding(top = 40.dp)) {
            SectionHeader(R.string.system_settings)
            Text(
                text = stringResource(id = R.string.llm_header),
                style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.surface)
            )
            Row(
                Modifier
                    .padding(top = 20.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(
                    8.dp,
                    alignment = Alignment.CenterHorizontally
                ),
            ) {
                ModelSelection(llmModel, LlmOption.GPT35)
                ModelSelection(llmModel, LlmOption.GPT4)
            }
            Row(
                Modifier
                    .padding(top = 8.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(
                    8.dp,
                    alignment = Alignment.CenterHorizontally
                ),
            ) {
                ModelSelection(llmModel, LlmOption.Claude)
                ModelSelection(llmModel, LlmOption.Llama)
            }

            Text(
                text = stringResource(id = R.string.advanced_options),
                style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.surface),
                modifier = Modifier.padding(top = 32.dp)
            )

            SwitchItem(stringResource(id = R.string.haptic_feedback), checked = hapticFeedBack) {
                GlobalVM.updateHapticFeedBack(it)
            }
            SwitchItem(stringResource(id = R.string.enable_google_search), checked = enableSearch) {
                GlobalVM.updateEnableSearch(it)
            }
            SwitchItem(
                stringResource(id = R.string.enable_second_hand),
                checked = enableSecondBrain
            ) {
                GlobalVM.updateEnableSecondBrain(it)
            }
        }
    }
}

@Composable
fun UserInfo(loginUser: LoginUser) {
    Text(
        text = stringResource(R.string.name_pattern, loginUser.user.name ?: ""),
        style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.surface)
    )
    Text(
        text = stringResource(R.string.email_pattern, loginUser.user.email ?: ""),
        style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.surface)
    )
}

@Composable
fun LoginEntries() {
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .height(46.dp)
            .background(
                color = MaterialTheme.colorScheme.secondaryContainer,
                shape = RoundedCornerShape(size = 12.dp)
            )
            .clickable {
                GlobalVM.loginResult("ddddddd", User(name = "Edward", email = "ffff@ddd.com"))
            }
    ) {
        VectorImage(
            modifier = Modifier.size(24.dp),
            resId = R.drawable.ic_google
        )
        Text(
            text = "Google", style = TextStyle(
                fontSize = 16.sp,
                lineHeight = 25.6.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.surface,
            )
        )
    }

}

@Composable
fun RowScope.ModelSelection(current: ILlmOption?, option: ILlmOption) {
    RoundedButton(modifier = Modifier
        .weight(1f)
        .borderStyle(current, option)
        .height(46.dp),
        onClick = {
            GlobalVM.updateModel(option)
        }) {
        Text(
            text = option.display, style = MaterialTheme.typography.bodyMedium.copy(
                color = MaterialTheme.colorScheme.surface
            )
        )
    }
}

@Composable
fun SwitchItem(
    title: String,
    modifier: Modifier = Modifier,
    checked: Boolean? = false,
    onChanged: ((Boolean) -> Unit)? = null
) {
    Row(
        modifier = modifier
            .height(38.dp)
            .fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(text = title, style = MaterialTheme.typography.bodyMedium)
        }

        Switch(
            colors = SwitchDefaults.colors(checkedThumbColor = Color.White),
            checked = checked ?: false,
            onCheckedChange = onChanged
        )
    }
}


@Preview(showBackground = true)
@Composable
fun SettingsPreview() {
    SettingsPage()
}