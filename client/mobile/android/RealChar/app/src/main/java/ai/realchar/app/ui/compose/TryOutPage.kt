/**
 * Created by obesitychow on 8/17/23
 */

package ai.realchar.app.ui.compose

import ai.realchar.app.R
import ai.realchar.app.model.Character
import ai.realchar.app.ui.compose.widgets.CircularImage
import ai.realchar.app.ui.compose.widgets.RoundedButton
import ai.realchar.app.ui.compose.widgets.SectionHeader
import ai.realchar.app.ui.compose.widgets.borderStyle
import ai.realchar.app.ui.vm.CharactersModel
import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.constraintlayout.compose.ConstraintLayout
import androidx.constraintlayout.compose.Dimension
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun ColumnScope.TryOutPage(
    viewModel: CharactersModel = viewModel()
) {
    val state by viewModel.loadingState.observeAsState(initial = CharactersModel.LoadingState.LOADING)
    val characters by viewModel.characters.observeAsState(null)

    val selectedCharacter = remember {
        mutableStateOf<Character?>(null)
    }
    SectionHeader(resId = R.string.choose_your_partner)
    ConstraintLayout(
        modifier = Modifier
            .fillMaxWidth()
            .weight(1f)
    ) {
        val (list, cta) = createRefs()
        ListArea(
            modifier = Modifier.constrainAs(list) {
                width = Dimension.matchParent
                height = Dimension.fillToConstraints
                start.linkTo(parent.start)
                end.linkTo(parent.end)
                top.linkTo(parent.top)
                bottom.linkTo(cta.top, 8.dp)
            },
            selected = selectedCharacter,
            characters = characters,
            loadingState = state
        )
        Row(
            modifier = Modifier
                .background(
                    color = MaterialTheme.colorScheme.primary,
                    shape = RoundedCornerShape(size = 4.dp)
                )
                .constrainAs(cta) {
                    width = Dimension.matchParent
                    height = Dimension.value(52.dp)
                    start.linkTo(parent.start)
                    end.linkTo(parent.end)
                    bottom.linkTo(parent.bottom, margin = 10.dp)
                },
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(id = R.string.start),
                style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.inversePrimary)
            )
        }
    }

}

@Composable
fun ListArea(
    modifier: Modifier = Modifier,
    selected: MutableState<Character?>,
    characters: List<Character>?,
    loadingState: CharactersModel.LoadingState
) {
    Box(modifier = modifier) {
        characters?.let {
            LazyColumn {
                items(characters.size) {
                    CharacterOption(selected = selected, item = characters[it])
                }
            }
        } ?: null
        /** todo empty / failed status */
    }


    Log.e("EDDIE", "loading status: $loadingState")

}

@Composable
fun CharacterOption(selected: MutableState<Character?>, item: Character) {
    RoundedButton(
        modifier = Modifier
            .padding(vertical = 4.dp)
            .borderStyle(selected.value, item)
            .fillMaxWidth(), onClick = { selected.value = item },
        horizontalArrangement = Arrangement.Start
    ) {
        CircularImage(
            modifier = Modifier
                .padding(vertical = 10.dp, horizontal = 12.dp)
                .size(40.dp),
            /** fixme default img */
            url = item.imageUrl ?: "https://cdn-icons-png.flaticon.com/128/10928/10928937.png"
        )
        Text(text = item.name, style = MaterialTheme.typography.bodyMedium)
    }

}