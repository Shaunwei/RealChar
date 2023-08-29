/**
 * Created by obesitychow on 8/18/23
 */

package ai.realchar.app

import android.app.Application
import android.content.Context

class RealCharApplication: Application() {
    companion object {
        lateinit var applicationCtx: Context
    }

    override fun onCreate() {
        super.onCreate()
        applicationCtx = applicationContext
    }
}