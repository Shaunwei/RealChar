/**
 * Created by obesitychow on 8/20/23
 */

package ai.realchar.app.ui.compose.widgets

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.layout
import androidx.compose.ui.res.vectorResource
import coil.compose.AsyncImage

@Composable
fun CircularImage(modifier: Modifier = Modifier, url: Any?) {
    AsyncImage(
        model = url,
        contentDescription = null,
        modifier = modifier
            .clip(CircleShape)
            .layout { measurable, constraints ->
                val placeable = measurable.measure(constraints)
                layout(placeable.width, placeable.height) {
                    placeable.placeRelative(0, 0)
                }
            },
        contentScale = ContentScale.Crop
    )
}

@Composable
fun VectorImage(modifier: Modifier = Modifier, @DrawableRes resId: Int) {
    Image(
        modifier = modifier,
        painter = rememberVectorPainter(image = ImageVector.vectorResource(id = resId)),
        contentDescription = null
    )
}
