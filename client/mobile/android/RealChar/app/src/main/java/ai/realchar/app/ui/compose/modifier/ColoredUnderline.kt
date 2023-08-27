/**
 * Created by obesitychow on 8/17/23
 */

package ai.realchar.app.ui.compose.modifier

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

fun Modifier.coloredUnderline(color: Color = Color.Black, thickness: Dp = 2.dp) =
    this.then(Modifier.drawBehind {
        val strokeWidthPx = thickness.toPx()
        val verticalOffset = size.height + 2.sp.toPx()
        drawLine(
            color = color,
            strokeWidth = strokeWidthPx,
            start = Offset(0f, verticalOffset),
            end = Offset(size.width, verticalOffset)
        )
    })