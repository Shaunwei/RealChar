/**
 * Created by obesitychow on 8/16/23
 */

package ai.realchar.app.ui.activity

import ai.realchar.app.R
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.commit

class HostActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_host)

        if (savedInstanceState == null) {
            intent?.extras?.let { bundle ->
                val fragmentClass =
                    bundle.getSerializable(EXTRA_FRAGMENT_CLASS) as? Class<out Fragment>
                fragmentClass?.let {
                    val fragment = fragmentClass.newInstance()
                    fragment.arguments = bundle.getBundle(EXTRA_FRAGMENT_ARGS)

                    val fragmentTag = fragmentClass.simpleName
                    supportFragmentManager.commit {
                        add(R.id.root, fragment, fragmentTag)
                    }
                }
            }
        }
    }

    companion object {
        const val EXTRA_FRAGMENT_CLASS = "extra_fragment_class"
        const val EXTRA_FRAGMENT_ARGS = "extra_fragment_args"

        fun open(context: Context?, fragmentClass: Class<out Fragment>, args: Bundle? = null) {
            context ?: return
            val intent = Intent(context, HostActivity::class.java)
            intent.putExtra(EXTRA_FRAGMENT_CLASS, fragmentClass)
            if (args != null) {
                intent.putExtra(EXTRA_FRAGMENT_ARGS, args)
            }
            context.startActivity(intent)
        }
    }
}
