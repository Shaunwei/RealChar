/**
 * Created by obesitychow on 8/20/23
 */

package ai.realchar.app.ui.compose.widgets

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp


@Composable
fun RoundedButton(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)?,
    horizontalArrangement: Arrangement.Horizontal = Arrangement.Center,
    verticalAlignment: Alignment.Vertical = Alignment.CenterVertically,
    content: @Composable() (RowScope.() -> Unit)
) {
    Row(
        modifier = Modifier
            .then(modifier)
            .background(
                color = MaterialTheme.colorScheme.secondaryContainer,
                shape = RoundedCornerShape(size = 12.dp)
            )
            .clickable(onClick = onClick ?: {}, indication = null, interactionSource = remember {
                MutableInteractionSource()
            }),
        verticalAlignment = verticalAlignment,
        horizontalArrangement = horizontalArrangement

    ) {
        content()
    }
}


@Composable
fun CircleButton(
    modifier: Modifier = Modifier,
    backgroundColor: Color,
    strokeColor: Color = backgroundColor,
    strokeWidth: Dp = 2.dp,
    onClick: (() -> Unit)?,
    content: @Composable() (RowScope.() -> Unit)
) {
    Row(
        modifier = Modifier
            // set the size before applying the transparent modifier in case of customized size.
            .size(52.dp)
            .background(color = backgroundColor, shape = CircleShape)
            .border(
                width = strokeWidth,
                color = strokeColor,
                shape = CircleShape
            )
            .then(modifier)
            .clickable {
                onClick?.invoke()
            },
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        content()
    }
}

fun Modifier.borderStyle(v: Any?, target: Any?) = if (v == target) this.border(
    width = 2.dp,
    color = Color(0xFFA7BFFF),
    shape = RoundedCornerShape(size = 12.dp)
) else this