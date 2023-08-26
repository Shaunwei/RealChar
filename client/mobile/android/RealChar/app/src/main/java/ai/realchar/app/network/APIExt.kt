/**
 * Created by obesitychow on 8/20/23
 */

package ai.realchar.app.network

import ai.realchar.app.BuildConfig
import android.util.Log
import com.jakewharton.retrofit2.adapter.rxjava2.RxJava2CallAdapterFactory
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.toResponseBody
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory


private val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(RetrofitExceptionInterceptor()) // 添加异常处理拦截器
    // 添加其他配置...
    .build()

private val retrofit = Retrofit.Builder()
    .baseUrl(BuildConfig.API_BASE_URL)
    .client(okHttpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .addCallAdapterFactory(RxJava2CallAdapterFactory.create())
    .build()

fun <T> api(definingClass: Class<T>) = retrofit.create(definingClass)

private class RetrofitExceptionInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response: Response

        try {
            response = chain.proceed(request)
        } catch (e: Exception) {
            Log.e("Network", "on err", e)
            return Response.Builder()
                .request(request)
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body("[]".toResponseBody("application/json".toMediaTypeOrNull()))
                .build()
        }

        return response
    }
}