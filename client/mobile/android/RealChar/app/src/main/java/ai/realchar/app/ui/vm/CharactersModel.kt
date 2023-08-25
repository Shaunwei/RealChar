/**
 * Created by obesitychow on 8/17/23
 */

package ai.realchar.app.ui.vm

import ai.realchar.app.model.Character
import ai.realchar.app.network.CharacterApi
import ai.realchar.app.network.api
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import io.reactivex.disposables.Disposable
import io.reactivex.schedulers.Schedulers

class CharactersModel : ViewModel() {
    private val API by lazy { api(CharacterApi::class.java) }

    private val _isLoading = MutableLiveData(LoadingState.SUCCEEDED)
    val loadingState: LiveData<LoadingState> = _isLoading


    private val _character = MutableLiveData<List<Character>?>().apply {
        refreshCharacters()
    }
    val characters: LiveData<List<Character>?> = _character

    @Volatile
    private var disposable: Disposable? = null
    fun refreshCharacters() {
        // todo err handling
        disposable?.dispose()
        _isLoading.postValue(LoadingState.LOADING)
        disposable = API.getCharacters().subscribeOn(Schedulers.io()).doOnError {
            _isLoading.postValue(LoadingState.FAILED)
        }.subscribe {
            /**
             * fixme: remove this when the server returns id.
             */
            val resp = it?.mapIndexed{idx, v -> v.copy(id = "god${if (idx == 0) "" else idx}") }
            _character.postValue(resp)
            _isLoading.postValue(LoadingState.SUCCEEDED)
        }
    }

    enum class LoadingState {
        LOADING,
        SUCCEEDED,
        FAILED,
    }
}