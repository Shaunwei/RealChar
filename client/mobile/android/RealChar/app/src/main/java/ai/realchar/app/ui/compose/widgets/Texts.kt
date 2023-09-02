/**
 * Created by obesitychow on 8/20/23
 */

package ai.realchar.app.ui.compose.widgets

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp


@Composable
fun SectionHeader(resId: Int) {
    Text(
        modifier= Modifier.padding(bottom = 20.dp),
        text = stringResource(id = resId), style = TextStyle(
            fontSize = 18.sp,
            lineHeight = 28.8.sp,
//    fontFamily = FontFamily(Font(R.font.prompt)),
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.surface,
        )
    )
}
