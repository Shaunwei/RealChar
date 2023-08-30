/**
 * Created by obesitychow on 8/17/23
 */

package ai.realchar.app.ui.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp


@Composable
fun AboutPage() {
    Column(
        modifier = Modifier
            .verticalScroll(rememberScrollState())
            .fillMaxSize()
    ) {
        Text(text = buildAnnotatedString {
            withStyle(
                SpanStyle(
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.tertiary
                )
            ) {
                append("RealChar")
            }
            withStyle(
                SpanStyle(
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.surface
                )
            ) {
                append(" is a revolutionary project enabling dynamic audio-visual interactions between humans and AI.\n\nPowered by Large Language Model (LLM), it offers instant, natural, and context-aware responses, paving the way for a new era of interactive AI experiences.\n\nDisclaimer: Fictional characters for entertainment purposes only.")
            }
        })

        Spacer(modifier = Modifier.height(40.dp))

        Text(
            text = "Authors",
            style = TextStyle(
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.tertiary
            )
        )

        Text(
            text = "Shaunwei, lynchee-owo, obesitychow, pycui",
            style = TextStyle(
                fontSize = 16.sp,
                fontWeight = FontWeight.Normal,
                color = MaterialTheme.colorScheme.surface
            )
        )

        Spacer(modifier = Modifier.height(40.dp))

        Text(
            text = "RealChar is Open Source",
            style = TextStyle(
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.tertiary
            )
        )
    }

//        CtaButton(
//            style = ButtonDefaults.ButtonStyle(backgroundColor = MaterialTheme.colorScheme.tertiary),
//            action = {
//                // Handle button click here
//            },
//            text = "Contribute"
//        )
}
