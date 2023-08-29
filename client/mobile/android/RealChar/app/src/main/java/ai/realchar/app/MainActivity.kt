/**
 * Created by obesitychow on 8/16/23
 */

package ai.realchar.app

import ai.realchar.app.ui.fragment.MainFragment
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.commit

class MainActivity : AppCompatActivity() {
    companion object {
        private const val FRAGMENT_TAG = "tag"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_host)
        if (savedInstanceState == null) {
            supportFragmentManager.commit {
                add(R.id.root, MainFragment().apply {
                    arguments = intent.extras
                }, FRAGMENT_TAG)
            }
        }
    }
}