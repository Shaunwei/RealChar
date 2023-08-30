/**
 * Created by obesitychow on 8/15/23
 */

package ai.realchar.app.ui.vm

import ai.realchar.app.RealCharApplication
import ai.realchar.app.model.ILanguage
import ai.realchar.app.model.ILlmOption
import ai.realchar.app.model.LanguageOption
import ai.realchar.app.model.LlmOption
import ai.realchar.app.model.LoginUser
import ai.realchar.app.model.User
import ai.realchar.app.util.GSON
import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

object GlobalVM : ViewModel() {
    private const val KEY_LOGIN_USER = "login_user"
    private val _loginUser = MutableLiveData<LoginUser?>(null)

    private const val KEY_LANGUAGE = "language"
    private val _language = MutableLiveData<ILanguage>(LanguageOption.English)

    private const val KEY_MODEL = "model"
    private val _model = MutableLiveData<ILlmOption>(LlmOption.GPT35)

    private const val KEY_HAPTIC_FEED_BACK = "haptic_feed_back"
    private val _hapticFeedBack = MutableLiveData(false)

    private const val KEY_ENABLE_SEARCH = "enable_search"
    private val _enableSearch = MutableLiveData(false)

    private const val KEY_ENABLE_SECOND_BRAIN = "enable_second_brain"
    private val _enableSecondBrain = MutableLiveData(false)

    val loginUser: LiveData<LoginUser?> = _loginUser
    val language: LiveData<ILanguage> = _language
    val model: LiveData<ILlmOption> = _model

    val hapticFeedBack: LiveData<Boolean> = _hapticFeedBack
    val enableSearch: LiveData<Boolean> = _enableSearch
    val enableSecondBrain: LiveData<Boolean> = _enableSecondBrain

    private val sp by lazy {
        RealCharApplication.applicationCtx.getSharedPreferences(
            "global",
            Context.MODE_PRIVATE
        )
    }

    init {
        val all = sp.all
        (all[KEY_LOGIN_USER] as? String)?.apply {
            val u = kotlin.runCatching { GSON.fromJson(this, LoginUser::class.java) }.getOrNull()
            _loginUser.postValue(u)
        }

        (all[KEY_ENABLE_SEARCH] as? Boolean)?.apply {
            _enableSearch.postValue(this)
        }

        (all[KEY_HAPTIC_FEED_BACK] as? Boolean)?.apply {
            _hapticFeedBack.postValue(this)
        }

        (all[KEY_ENABLE_SECOND_BRAIN] as? Boolean)?.apply {
            _enableSecondBrain.postValue(this)
        }

        (all[KEY_LANGUAGE] as? String)?.apply {
            _language.postValue(LanguageOption.fromRaw(this))
        }

        (all[KEY_MODEL] as? String)?.apply {
            _model.postValue(LlmOption.fromRaw(this))
        }
    }

    fun loginResult(token: String, user: User) {
        updateLoginUser(LoginUser(token, user))
    }

    private fun updateLoginUser(loginUser: LoginUser?) {
        _loginUser.postValue(loginUser)
        sp.editAndCommit {
            putString(KEY_LOGIN_USER, GSON.toJson(loginUser))
        }
    }

    fun logout() {
        updateLoginUser(null)
    }

    fun updateModel(model: ILlmOption) {
        _model.postValue(model)
        sp.editAndCommit {
            putString(KEY_MODEL, model.raw)
        }
    }

    fun updateEnableSearch(enabled: Boolean) {
        _enableSearch.postValue(enabled)
        sp.editAndCommit {
            putBoolean(KEY_ENABLE_SEARCH, enabled)
        }
    }

    fun updateHapticFeedBack(enabled: Boolean) {
        _hapticFeedBack.postValue(enabled)
        sp.editAndCommit {
            putBoolean(KEY_HAPTIC_FEED_BACK, enabled)
        }
    }

    fun updateEnableSecondBrain(enabled: Boolean) {
        _enableSecondBrain.postValue(enabled)
        sp.editAndCommit {
            putBoolean(KEY_ENABLE_SECOND_BRAIN, enabled)
        }
    }

    fun SharedPreferences.editAndCommit(edit: SharedPreferences.Editor.() -> Unit) {
        sp.edit(commit = true, edit)
    }
}